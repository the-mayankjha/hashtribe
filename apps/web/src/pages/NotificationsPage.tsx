import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Heart, MessageCircle, AtSign, Users, UserPlus, X, ArrowLeft } from 'lucide-react';
import { useNotificationStore, type Notification, type NotificationType } from '@/stores/notificationStore';

function timeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

const typeIcon: Record<NotificationType, JSX.Element> = {
    like: <Heart className="w-4 h-4 text-red-400" />,
    comment: <MessageCircle className="w-4 h-4 text-blue-400" />,
    mention: <AtSign className="w-4 h-4 text-purple-400" />,
    tribe_invite: <Users className="w-4 h-4 text-amber-400" />,
    follow: <UserPlus className="w-4 h-4 text-green-400" />,
};

const typeLabel: Record<NotificationType, string> = {
    like: 'Likes',
    comment: 'Comments',
    mention: 'Mentions',
    tribe_invite: 'Tribe Invites',
    follow: 'Follows',
};

function NotificationRow({ notification }: { notification: Notification }) {
    const { markAsRead, dismiss } = useNotificationStore();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            transition={{ duration: 0.2 }}
            className={`group relative flex items-start gap-4 px-6 py-4 border-b border-grey-100 dark:border-charcoal-800/60 transition-colors ${!notification.isRead ? 'bg-grey-50/60 dark:bg-charcoal-800/20' : 'hover:bg-grey-50/40 dark:hover:bg-charcoal-800/10'
                }`}
        >
            {/* Unread indicator bar */}
            {!notification.isRead && (
                <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-charcoal-900 dark:bg-white rounded-r" />
            )}

            {/* Avatar + type icon */}
            <div className="relative flex-shrink-0">
                <img
                    src={notification.actorAvatar}
                    alt={notification.actorName}
                    className="w-11 h-11 rounded-full object-cover"
                />
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-charcoal-900 border border-grey-200 dark:border-charcoal-700 flex items-center justify-center shadow-sm">
                    {typeIcon[notification.type]}
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-sm text-charcoal-900 dark:text-grey-100 leading-snug">
                    <span className="font-semibold">{notification.actorName}</span>{' '}
                    <span className="text-grey-600 dark:text-grey-400">{notification.message}</span>
                </p>
                <p className="text-xs text-grey-400 dark:text-grey-500 mt-1 font-mono">
                    {timeAgo(notification.createdAt)}
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 sm:transition-opacity max-sm:opacity-100">
                {!notification.isRead && (
                    <button
                        onClick={() => markAsRead([notification.id])}
                        title="Mark as read"
                        className="p-1.5 rounded-lg text-grey-400 hover:text-charcoal-900 dark:hover:text-white hover:bg-grey-100 dark:hover:bg-charcoal-700 transition-colors"
                    >
                        <CheckCheck className="w-4 h-4" />
                    </button>
                )}
                <button
                    onClick={() => dismiss([notification.id])}
                    title="Dismiss"
                    className="p-1.5 rounded-lg text-grey-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>        </motion.div>
    );
}

export function NotificationsPage() {
    const { notifications, markAllAsRead } = useNotificationStore();
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const grouped = notifications.reduce<Record<string, Notification[]>>((acc, n) => {
        const label = typeLabel[n.type];
        if (!acc[label]) acc[label] = [];
        acc[label].push(n);
        return acc;
    }, {});

    return (
        <div className="max-w-2xl mx-auto">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Link
                        to="/feed"
                        className="p-2 rounded-lg text-grey-500 hover:text-charcoal-900 dark:hover:text-white hover:bg-grey-100 dark:hover:bg-charcoal-800 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
                            <Bell className="w-5 h-5" />
                            Notifications
                            {unreadCount > 0 && (
                                <span className="min-w-[22px] h-5 px-1 bg-charcoal-900 dark:bg-white text-white dark:text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {unreadCount}
                                </span>
                            )}
                        </h1>
                        <p className="text-sm text-grey-500 dark:text-grey-400 mt-0.5">
                            {notifications.length === 0 ? 'All caught up!' : `${notifications.length} notification${notifications.length > 1 ? 's' : ''}`}
                        </p>
                    </div>
                </div>

                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-1.5 text-sm text-grey-500 dark:text-grey-400 hover:text-charcoal-900 dark:hover:text-white transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-grey-100 dark:hover:bg-charcoal-800"
                    >
                        <CheckCheck className="w-4 h-4" />
                        Mark all read
                    </button>
                )}
            </div>

            {/* Notification List */}
            <div className="card p-0 overflow-hidden">
                {notifications.length === 0 ? (
                    <div className="py-20 text-center">
                        <div className="w-16 h-16 rounded-full bg-grey-100 dark:bg-charcoal-800 flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-8 h-8 text-grey-400 dark:text-grey-500" />
                        </div>
                        <p className="font-semibold text-charcoal-900 dark:text-white mb-1">You're all caught up!</p>
                        <p className="text-sm text-grey-500 dark:text-grey-400">No notifications to show.</p>
                    </div>
                ) : (
                    Object.entries(grouped).map(([label, items]) => (
                        <div key={label}>
                            <div className="px-6 py-2 bg-grey-50 dark:bg-charcoal-950/50 border-b border-grey-100 dark:border-charcoal-800">
                                <span className="text-[11px] font-semibold text-grey-500 dark:text-grey-400 uppercase tracking-wider">
                                    {label}
                                </span>
                            </div>
                            <AnimatePresence initial={false}>
                                {items.map((n) => (
                                    <NotificationRow key={n.id} notification={n} />
                                ))}
                            </AnimatePresence>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
