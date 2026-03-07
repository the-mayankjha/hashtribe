import { Link } from 'react-router-dom';
import { formatRelativeTime } from '@hashtribe/shared/utils';
import { MessageSquare, Share2, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { Post, ReactionType } from '@/stores/postStore';
import { useAuthStore } from '@/stores/authStore';
import { ReactionPicker } from './ReactionPicker';

interface PostCardProps {
    post: Post;
    onReact: (id: string, type: ReactionType) => void;
    onDelete: (id: string) => void;
    showTribe?: boolean;
}

export function PostCard({ post, onReact, onDelete, showTribe = false }: PostCardProps) {
    const { user } = useAuthStore();
    const isOwner = user?.id === post.user_id;

    return (
        <div className="flex gap-4 p-5 border-b border-grey-200 dark:border-charcoal-800 hover:bg-grey-50/50 dark:hover:bg-charcoal-900/30 hover:shadow-sm dark:hover:shadow-md hover:border-grey-300 dark:hover:border-charcoal-700 transition-all duration-200 last:border-b-0">
            {/* Avatar */}
            <Link to={`/profile/${post.user.username}`} className="flex-shrink-0">
                <img
                    src={post.user.avatar_url || `https://ui-avatars.com/api/?name=${post.user.username}&background=random`}
                    alt={post.user.username}
                    className="w-10 h-10 rounded-full bg-grey-200 dark:bg-charcoal-700 object-cover"
                />
            </Link>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-1">
                            <Link to={`/profile/${post.user.username}`} className="font-semibold text-charcoal-900 dark:text-white hover:underline text-sm">
                                {post.user.display_name || post.user.username}
                            </Link>
                            <span className="text-xs text-grey-500 dark:text-grey-600">@{post.user.username}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            {showTribe && post.tribe && (
                                <>
                                    <Link to={`/tribes/${post.tribe.slug}`} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary-500/10 text-primary-400 text-xs font-medium hover:bg-primary-500/20 hover:text-primary-300 transition-colors">
                                        {post.tribe.name}
                                    </Link>
                                    <span className="text-grey-600">·</span>
                                </>
                            )}
                            <span className="text-xs text-grey-400 dark:text-grey-700 hover:text-charcoal-900 dark:hover:text-grey-600 cursor-pointer">
                                {formatRelativeTime(post.created_at)}
                            </span>
                        </div>
                    </div>
                    {isOwner && (
                        <button className="p-2 rounded-full text-grey-500 hover:text-red-500 hover:bg-red-500/10 transition-all duration-200" onClick={() => onDelete(post.id)}>
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Body */}
                <p className="mt-1 text-charcoal-800 dark:text-grey-200 whitespace-pre-wrap break-words text-[15px] leading-normal">
                    {post.content}
                </p>

                {/* Attachments */}
                {post.image_urls && post.image_urls.length > 0 && (
                    <div className={clsx(
                        "mt-3 rounded-2xl overflow-hidden border border-grey-200 dark:border-charcoal-700/60 hover:border-grey-300 dark:hover:border-charcoal-600 transition-colors duration-200",
                        post.image_urls.length === 1 ? "" : "grid grid-cols-2 gap-1"
                    )}>
                        {post.image_urls.map((url, index) => (
                            <img
                                key={index}
                                src={url}
                                alt={`Post attachment ${index + 1}`}
                                className={clsx(
                                    "w-full h-auto object-cover",
                                    post.image_urls!.length === 1 ? "max-h-96" : "h-48"
                                )}
                            />
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-4 mt-4 max-w-md items-center">
                    <ReactionPicker
                        userReaction={post.user_reaction || (post.liked_by_user ? 'like' : null)}
                        reactionsSummary={post.reactions_summary || { like: post.likes_count || 0 }}
                        onSelect={(type) => onReact(post.id, type)}
                    />

                    <button className="flex items-center gap-1.5 px-3 py-2 rounded-full text-grey-500 hover:text-blue-400 hover:bg-blue-400/10 transition-all duration-200">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-xs font-medium">{post.replies_count || ''}</span>
                    </button>

                    <button className="flex items-center gap-1.5 px-3 py-2 rounded-full text-grey-500 hover:text-green-400 hover:bg-green-400/10 transition-all duration-200">
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
