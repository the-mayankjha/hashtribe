import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTribeStore } from '@/stores/tribeStore';
import { useAuthStore } from '@/stores/authStore';
import { usePostStore } from '@/stores/postStore';
import { useTopicStore } from '@/stores/topicStore';
import { formatRelativeTime } from '@hashtribe/shared/utils';
import { CreatePost } from '@/components/Feed/CreatePost';
import { PostCard } from '@/components/Feed/PostCard';
import { CreateTopic } from '@/components/Topics/CreateTopic';
import { TopicCard } from '@/components/Topics/TopicCard';
import clsx from 'clsx';
import { Settings, Users, Calendar, MessageSquare, Hash } from 'lucide-react';

export function TribeDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const { currentTribe, members, loading: tribeLoading, fetchTribeBySlug, joinTribe, leaveTribe } = useTribeStore();
    const { posts, loading: postsLoading, fetchPosts, createPost, toggleReaction, deletePost } = usePostStore();
    const { topics, loading: topicsLoading, fetchTopics, createTopic, deleteTopic } = useTopicStore();
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'posts' | 'discussions'>('posts');
    const [showCreateTopic, setShowCreateTopic] = useState(false);

    useEffect(() => {
        if (slug) {
            fetchTribeBySlug(slug, user?.id);
        }
    }, [slug, user?.id]);

    useEffect(() => {
        if (currentTribe?.id) {
            fetchPosts(currentTribe.id, user?.id);
            fetchTopics(currentTribe.id);
        }
    }, [currentTribe?.id, user?.id]);

    if (tribeLoading || !currentTribe) {
        if (!tribeLoading && !currentTribe) {
            return (
                <div className="text-center py-20">
                    <h2 className="text-2xl font-bold mb-2">Tribe not found</h2>
                    <Link to="/tribes" className="text-primary-500 hover:underline">Return to Explore</Link>
                </div>
            );
        }
        return (
            <div className="text-center py-20">
                <div className="w-12 h-12 border-4 border-grey-200 dark:border-charcoal-600 border-t-charcoal-900 dark:border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            </div>
        );
    }

    const userMembership = members.find(m => m.user_id === user?.id);
    const isMember = !!userMembership;
    const isAdmin = userMembership?.role === 'admin';

    const handleJoinLeave = async () => {
        if (!user) return;
        try {
            if (isMember) {
                await leaveTribe(currentTribe.id, user.id);
            } else {
                await joinTribe(currentTribe.id, user.id);
            }
        } catch (error) {
            console.error('Error joining/leaving tribe:', error);
        }
    };

    const handleCreatePost = async (content: string, imageUrls?: string[]) => {
        if (!user || !currentTribe) return;
        await createPost(currentTribe.id, user.id, content, imageUrls);
    };

    const handleCreateTopic = async (title: string, content: string) => {
        if (!user || !currentTribe) return;
        await createTopic(currentTribe.id, user.id, title, content);
    };

    return (
        <div className="min-h-screen">
            {/* Cover Image Placeholder */}
            <div className="h-48 md:h-64 bg-gradient-to-r from-grey-200 dark:from-charcoal-900 to-grey-300 dark:to-black relative rounded-b-3xl border-b border-grey-200 dark:border-charcoal-800 -mt-8 -mx-4 md:-mx-8 lg:-mx-8 mb-4">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10 mix-blend-overlay"></div>
                {/* Tribe Info Overlay */}
                <div className="absolute bottom-0 left-0 p-6 md:p-8 flex items-end gap-6 w-full bg-gradient-to-t from-white/90 dark:from-black/90 to-transparent">
                    {/* Avatar/Logo */}
                    <div className="w-24 h-24 rounded-2xl bg-white dark:bg-charcoal-800 border-4 border-grey-200 dark:border-black flex items-center justify-center shadow-2xl overflow-hidden">
                        <span className="text-3xl font-bold text-charcoal-900 dark:text-white uppercase">{currentTribe.name.substring(0, 2)}</span>
                    </div>

                    <div className="flex-1 mb-2">
                        <h1 className="text-3xl md:text-4xl font-bold text-charcoal-900 dark:text-white mb-1 font-display">{currentTribe.name}</h1>
                        <div className="flex items-center gap-4 text-grey-500 dark:text-grey-400 text-sm font-mono">
                            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {members.length} Members</span>
                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Created {formatRelativeTime(currentTribe.created_at)}</span>
                        </div>
                    </div>

                    <div className="flex gap-2 mb-2">
                        {currentTribe.visibility === 'public' && (
                            <button
                                onClick={handleJoinLeave}
                                className={clsx(
                                    'px-6 py-2 rounded-full font-bold text-sm transition-all shadow-glow-sm',
                                    isMember
                                        ? 'bg-transparent border border-red-500 text-red-500 hover:bg-red-500/10'
                                        : 'bg-charcoal-900 dark:bg-white text-white dark:text-black hover:bg-charcoal-800 dark:hover:bg-grey-200'
                                )}
                            >
                                {isMember ? 'Leave' : 'Join'}
                            </button>
                        )}
                        {isAdmin && (
                            <Link to={`/tribes/${slug}/settings`} className="p-2 rounded-full bg-grey-200 dark:bg-charcoal-800 text-grey-500 dark:text-grey-400 hover:text-charcoal-900 dark:hover:text-white hover:bg-grey-300 dark:hover:bg-charcoal-700 transition-colors">
                                <Settings className="w-5 h-5" />
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Tabs */}
                    <div className="bg-white dark:bg-black border border-grey-200 dark:border-charcoal-800 rounded-xl overflow-hidden shadow-sm">
                        <div className="flex border-b border-grey-200 dark:border-charcoal-800">
                            <button
                                onClick={() => setActiveTab('posts')}
                                className={clsx(
                                    'flex-1 px-6 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2',
                                    activeTab === 'posts'
                                        ? 'bg-charcoal-900 dark:bg-primary-600 text-white'
                                        : 'text-grey-500 dark:text-grey-400 hover:text-charcoal-900 dark:hover:text-white hover:bg-grey-100 dark:hover:bg-charcoal-800'
                                )}
                            >
                                <Hash className="w-4 h-4" />
                                Posts
                            </button>
                            <button
                                onClick={() => setActiveTab('discussions')}
                                className={clsx(
                                    'flex-1 px-6 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2',
                                    activeTab === 'discussions'
                                        ? 'bg-charcoal-900 dark:bg-primary-600 text-white'
                                        : 'text-grey-500 dark:text-grey-400 hover:text-charcoal-900 dark:hover:text-white hover:bg-grey-100 dark:hover:bg-charcoal-800'
                                )}
                            >
                                <MessageSquare className="w-4 h-4" />
                                Discussions
                            </button>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'posts' && (
                            <div className="p-4 space-y-4">
                                {/* Create Post Widget */}
                                {isMember ? (
                                    <CreatePost onSubmit={handleCreatePost} />
                                ) : (
                                    <div className="bg-grey-50 dark:bg-charcoal-900/50 border border-grey-200 dark:border-charcoal-800 rounded-xl p-6 text-center">
                                        <p className="text-charcoal-900 dark:text-white font-bold mb-2">Join the Tribe to Participate</p>
                                        <p className="text-grey-500 dark:text-grey-400 text-sm mb-4">Become a member to create posts and interact with the community.</p>
                                        <button
                                            onClick={handleJoinLeave}
                                            className="px-6 py-2 rounded-full bg-charcoal-900 dark:bg-white text-white dark:text-black font-bold text-sm hover:bg-charcoal-800 dark:hover:bg-grey-200 transition-colors shadow-sm"
                                        >
                                            Join Tribe
                                        </button>
                                    </div>
                                )}

                                {/* Posts Feed */}
                                <div className="min-h-[200px]">
                                    {postsLoading && posts.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="w-8 h-8 border-2 border-charcoal-600 border-t-white rounded-full animate-spin mx-auto"></div>
                                        </div>
                                    ) : posts.length > 0 ? (
                                        <div className="space-y-4">
                                            {posts.map(post => (
                                                <PostCard
                                                    key={post.id}
                                                    post={post}
                                                    onReact={(id, type) => toggleReaction(id, user!.id, type)}
                                                    onDelete={deletePost}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-grey-500">
                                            <p className="font-mono text-sm">NO DATA DETECTED IN FEED</p>
                                            {isMember && <p className="text-xs mt-2">Be the first to transmit a signal.</p>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'discussions' && (
                            <div className="p-4 space-y-4">
                                {/* Create Topic Widget */}
                                {isMember ? (
                                    showCreateTopic ? (
                                        <CreateTopic
                                            onSubmit={handleCreateTopic}
                                            onCancel={() => setShowCreateTopic(false)}
                                        />
                                    ) : (
                                        <div className="text-center py-6">
                                            <button
                                                onClick={() => setShowCreateTopic(true)}
                                                className="px-6 py-3 bg-charcoal-900 dark:bg-primary-600 text-white font-bold rounded-full hover:bg-charcoal-800 dark:hover:bg-primary-500 transition-colors shadow-glow-sm"
                                            >
                                                Start a Discussion
                                            </button>
                                        </div>
                                    )
                                ) : (
                                    <div className="bg-grey-50 dark:bg-charcoal-900/50 border border-grey-200 dark:border-charcoal-800 rounded-xl p-6 text-center">
                                        <p className="text-charcoal-900 dark:text-white font-bold mb-2">Join the Tribe to Participate</p>
                                        <p className="text-grey-500 dark:text-grey-400 text-sm mb-4">Become a member to start discussions in the community.</p>
                                        <button
                                            onClick={handleJoinLeave}
                                            className="px-6 py-2 rounded-full bg-charcoal-900 dark:bg-white text-white dark:text-black font-bold text-sm hover:bg-charcoal-800 dark:hover:bg-grey-200 transition-colors shadow-sm"
                                        >
                                            Join Tribe
                                        </button>
                                    </div>
                                )}

                                {/* Topics List */}
                                <div className="min-h-[200px]">
                                    {topicsLoading && topics.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="w-8 h-8 border-2 border-charcoal-600 border-t-white rounded-full animate-spin mx-auto"></div>
                                        </div>
                                    ) : topics.length > 0 ? (
                                        <div className="space-y-4">
                                            {topics.map(topic => (
                                                <TopicCard
                                                    key={topic.id}
                                                    topic={topic}
                                                    onDelete={isAdmin || user?.id === topic.created_by ? deleteTopic : undefined}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-grey-500">
                                            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p className="font-mono text-sm">NO DISCUSSIONS YET</p>
                                            {isMember && <p className="text-xs mt-2">Start the first discussion in this tribe.</p>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar (Info / Members) */}
                <div className="space-y-6">
                    {/* Description Card */}
                    <div className="bg-white dark:bg-charcoal-900/50 border border-grey-200 dark:border-charcoal-800 rounded-xl p-6 shadow-sm">
                        <h3 className="text-charcoal-900 dark:text-white font-bold mb-3 uppercase tracking-wider text-sm">About Protocol</h3>
                        <p className="text-grey-600 dark:text-grey-400 text-sm leading-relaxed">
                            {currentTribe.description || "No transmission description available for this protocol unit."}
                        </p>
                    </div>

                    {/* Members Preview */}
                    <div className="bg-white dark:bg-charcoal-900/50 border border-grey-200 dark:border-charcoal-800 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-charcoal-900 dark:text-white font-bold uppercase tracking-wider text-sm">Nodes ({members.length})</h3>
                            <Link to={`/tribes/${slug}/members`} className="text-xs text-primary-500 hover:text-charcoal-900 dark:hover:text-white transition-colors">View All</Link>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {members.slice(0, 12).map(m => (
                                <Link key={m.id} to={`/profile/${m.users?.username}`} title={m.users?.username}>
                                    <img
                                        src={m.users?.avatar_url || `https://ui-avatars.com/api/?name=${m.users?.username}&background=random`}
                                        alt={m.users?.username}
                                        className={clsx(
                                            "w-8 h-8 rounded-full border border-grey-200 dark:border-charcoal-700 hover:border-charcoal-900 dark:hover:border-white transition-colors",
                                            m.role === 'admin' && "border-primary-500"
                                        )}
                                    />
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
