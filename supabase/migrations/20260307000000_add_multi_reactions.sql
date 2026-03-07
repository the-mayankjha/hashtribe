-- Migration to add multi-type post reactions

-- 1. Create Reaction Type Enum if it doesn't exist
-- Using a string check/constraint instead of ENUM for easier future additions in some cases, 
-- but ENUM is cleaner if types are strictly defined.
DO $$ BEGIN
    CREATE TYPE reaction_type AS ENUM ('like', 'useful', 'trending', 'support');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create post_reactions table
CREATE TABLE IF NOT EXISTS public.post_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    type reaction_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- 3. Add reactions_summary JSONB to posts for efficient count fetching
-- This stores something like {"like": 5, "useful": 2}
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS reactions_summary JSONB DEFAULT '{}';

-- 4. Migrate existing likes to the new table
INSERT INTO public.post_reactions (user_id, post_id, type)
SELECT user_id, post_id, 'like'::reaction_type
FROM public.post_likes
ON CONFLICT DO NOTHING;

-- 5. Enable RLS
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

-- 6. Policies
DROP POLICY IF EXISTS "Reactions are viewable by everyone" ON public.post_reactions;
CREATE POLICY "Reactions are viewable by everyone" 
ON public.post_reactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their own reactions" ON public.post_reactions;
CREATE POLICY "Users can manage their own reactions" 
ON public.post_reactions FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Optional: You can drop post_likes later once confirmed.
-- DROP TABLE public.post_likes;

-- 7. RPC for toggling reactions atomically
CREATE OR REPLACE FUNCTION toggle_post_reaction(
    target_post_id UUID,
    target_user_id UUID,
    reaction_type TEXT
) RETURNS VOID AS $$
DECLARE
    existing_type TEXT;
    summary JSONB;
BEGIN
    -- Check for existing reaction by this user on this post
    SELECT type::text INTO existing_type FROM post_reactions 
    WHERE post_id = target_post_id AND user_id = target_user_id;

    -- Get current summary
    SELECT reactions_summary INTO summary FROM posts WHERE id = target_post_id;
    IF summary IS NULL THEN summary := '{}'::JSONB; END IF;

    IF existing_type IS NOT NULL THEN
        -- Remove existing reaction
        DELETE FROM post_reactions WHERE post_id = target_post_id AND user_id = target_user_id;
        
        -- Decrement old type in summary
        summary := jsonb_set(
            summary, 
            ARRAY[existing_type], 
            (GREATEST(0, (COALESCE(summary->>existing_type, '0')::int) - 1))::text::jsonb
        );
        
        -- If the new reaction is different from the old one, insert it.
        IF existing_type != reaction_type THEN
            INSERT INTO post_reactions (post_id, user_id, type)
            VALUES (target_post_id, target_user_id, reaction_type::reaction_type);
            
            -- Increment new type
            summary := jsonb_set(
                summary, 
                ARRAY[reaction_type], 
                ((COALESCE(summary->>reaction_type, '0')::int) + 1)::text::jsonb
            );
        END IF;
    ELSE
        -- No existing reaction, just insert
        INSERT INTO post_reactions (post_id, user_id, type)
        VALUES (target_post_id, target_user_id, reaction_type::reaction_type);
        
        -- Increment new type
        summary := jsonb_set(
            summary, 
            ARRAY[reaction_type], 
            ((COALESCE(summary->>reaction_type, '0')::int) + 1)::text::jsonb
        );
    END IF;

    -- Update post summary and likes_count (for legacy compat)
    UPDATE posts 
    SET 
        reactions_summary = summary,
        likes_count = (COALESCE(summary->>'like', '0')::int)
    WHERE id = target_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
