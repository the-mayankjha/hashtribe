import { create } from 'zustand';
import { supabase as supabaseClient } from '@/lib/supabase';
const supabase = supabaseClient as any;

export type ReactionType = 'like' | 'useful' | 'trending' | 'support';

export interface Post {
    id: string | number;
    tribe_id: string;
    user_id: string;
    content: string | null;
    image_urls: string[] | null;
    created_at: string;
    likes_count: number;
    replies_count: number;
    user: {
        username: string;
        display_name: string;
        avatar_url: string;
    };
    tribe?: {
        name: string;
        slug: string;
        visibility: 'public' | 'private';
    };
    liked_by_user?: boolean;
    user_reaction?: ReactionType | null;
    reactions_summary?: Record<string, number>;
}

interface PostStore {
    posts: Post[];
    loading: boolean;
    error: string | null;
    fetchPosts: (tribeId: string, userId?: string) => Promise<void>;
    fetchFeed: (userId?: string) => Promise<void>;
    createPost: (tribeId: string, userId: string, content: string, imageUrls?: string[]) => Promise<void>;
    deletePost: (postId: string | number) => Promise<void>;
    toggleReaction: (postId: string | number, userId: string, reaction: ReactionType) => Promise<void>;
    toggleLike: (postId: string | number, userId: string) => Promise<void>;
}


export const usePostStore = create<PostStore>((set, get) => ({
    posts: [],
    loading: false,
    error: null,

    fetchPosts: async (tribeId, userId) => {
        set({ loading: true, error: null });
        try {
            const { data: rawPosts, error: postError } = await supabase
                .from('posts')
                .select('*')
                .eq('tribe_id', tribeId)
                .order('created_at', { ascending: false });

            if (postError) throw postError;
            if (!rawPosts || rawPosts.length === 0) {
                set({ posts: [], loading: false });
                return;
            }

            const userIds = [...new Set(rawPosts.map((p: any) => p.user_id))];
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, username, display_name, avatar_url')
                .in('id', userIds);

            const { data: tribeData } = await supabase
                .from('tribes')
                .select('id, name, slug, visibility')
                .eq('id', tribeId)
                .single();

            const profileMap = new Map(profiles?.map((p: any) => [p.id, p]));

            let posts: Post[] = rawPosts.map((p: any) => ({
                ...p,
                user: profileMap.get(p.user_id) || { username: 'unknown', display_name: 'Unknown User', avatar_url: '' },
                tribe: tribeData,
                liked_by_user: false,
                user_reaction: null,
                reactions_summary: p.reactions_summary || {}
            }));

            if (userId) {
                const postIds = posts.map(p => p.id);
                const { data: reactions } = await supabase
                    .from('post_reactions')
                    .select('post_id, type')
                    .eq('user_id', userId)
                    .in('post_id', postIds);

                const reactionMap = new Map(reactions?.map((r: any) => [r.post_id, r.type]));
                posts = posts.map(p => {
                    const type = reactionMap.get(p.id) as ReactionType;
                    return {
                        ...p,
                        user_reaction: type || null,
                        liked_by_user: type === 'like'
                    };
                });
            }

            set({ posts, loading: false });
        } catch (err: any) {
            console.error('Error fetching posts:', err);
            set({ loading: false, error: err.message || 'Failed to load posts' });
        }
    },

    fetchFeed: async (userId) => {
        set({ loading: true, error: null });
        try {
            const { data: rawPosts, error: postError } = await supabase
                .from('posts')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (postError) throw postError;
            if (!rawPosts || rawPosts.length === 0) {
                set({ posts: [], loading: false });
                return;
            }

            const userIds = [...new Set(rawPosts.map((p: any) => p.user_id))];
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, username, display_name, avatar_url')
                .in('id', userIds);

            const tribeIds = [...new Set(rawPosts.map((p: any) => p.tribe_id))];
            const { data: tribes } = await supabase
                .from('tribes')
                .select('id, name, slug, visibility')
                .in('id', tribeIds);

            const profileMap = new Map(profiles?.map((p: any) => [p.id, p]));
            const tribeMap = new Map(tribes?.map((t: any) => [t.id, t]));

            let posts: Post[] = rawPosts.map((p: any) => ({
                ...p,
                user: profileMap.get(p.user_id) || { username: 'unknown', display_name: 'Unknown User', avatar_url: '' },
                tribe: tribeMap.get(p.tribe_id),
                liked_by_user: false,
                user_reaction: null,
                reactions_summary: p.reactions_summary || {}
            }));

            if (userId) {
                const postIds = posts.map(p => p.id);
                const { data: reactions } = await supabase
                    .from('post_reactions')
                    .select('post_id, type')
                    .eq('user_id', userId)
                    .in('post_id', postIds);

                const reactionMap = new Map(reactions?.map((r: any) => [r.post_id, r.type]));
                posts = posts.map(p => {
                    const type = reactionMap.get(p.id) as ReactionType;
                    return {
                        ...p,
                        user_reaction: type || null,
                        liked_by_user: type === 'like'
                    };
                });
            }

            set({ posts, loading: false });
        } catch (err: any) {
            console.error('Error fetching feed:', err);
            set({ loading: false, error: err.message || 'Failed to load feed' });
        }
    },

    createPost: async (tribeId, userId, content, imageUrls = []) => {
        try {
            const { error } = await supabase
                .from('posts')
                .insert({ tribe_id: tribeId, user_id: userId, content, image_urls: imageUrls })
                .select().single();
            if (error) throw error;
            get().fetchPosts(tribeId, userId);
        } catch (error) {
            console.error('Error creating post:', error);
            throw error;
        }
    },

    deletePost: async (postId) => {
        try {
            const { error } = await supabase.from('posts').delete().eq('id', postId);
            if (error) throw error;
            set(state => ({ posts: state.posts.filter(p => p.id !== postId) }));
        } catch (error) {
            console.error('Error deleting post:', error);
        }
    },

    toggleReaction: async (postId, userId, reaction) => {
        const originalPosts = get().posts;

        // Optimistic UI update
        set(state => {
            const posts = [...state.posts];
            const idx = posts.findIndex(p => p.id === postId);
            if (idx === -1) return state;

            const post = posts[idx];
            const prevReaction = post.user_reaction;
            const newSummary = { ...(post.reactions_summary || {}) };

            if (prevReaction) {
                newSummary[prevReaction] = Math.max(0, (newSummary[prevReaction] || 0) - 1);
            }

            let nextReaction: ReactionType | null = reaction;
            if (prevReaction === reaction) {
                nextReaction = null;
            } else {
                newSummary[reaction] = (newSummary[reaction] || 0) + 1;
            }

            posts[idx] = {
                ...post,
                user_reaction: nextReaction,
                liked_by_user: nextReaction === 'like',
                reactions_summary: newSummary,
                likes_count: newSummary['like'] || 0
            };
            return { posts };
        });

        try {
            // FIX: Using correct parameter name 'reaction_type_name' to match RPC exactly
            const { error } = await supabase.rpc('toggle_post_reaction', {
                target_post_id: postId,
                target_user_id: userId,
                reaction_type_name: reaction
            });

            if (error) throw error;
        } catch (error: any) {
            console.error('Error toggling reaction:', error);
            set({ posts: originalPosts }); // Revert on failure
        }
    },

    toggleLike: async (postId, userId) => {
        return get().toggleReaction(postId, userId, 'like');
    }
}));
