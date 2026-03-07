import { create } from 'zustand';

export type NotificationType = 'like' | 'comment' | 'mention' | 'tribe_invite' | 'follow';

export interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    actorName: string;
    actorAvatar: string;
    href: string;
    isRead: boolean;
    createdAt: Date;
}

interface NotificationState {
    isOpen: boolean;
    notifications: Notification[];

    toggleDropdown: () => void;
    closeDropdown: () => void;
    markAsRead: (ids: string[]) => void;
    markAllAsRead: () => void;
    dismiss: (ids: string[]) => void;
    addNotification: (n: Notification) => void;
}

// Plays a soft double-tone chime via Web Audio API — no external file needed
function playNotificationSound() {
    try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const playTone = (freq: number, startAt: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + startAt);
            gain.gain.setValueAtTime(0.12, ctx.currentTime + startAt);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startAt + 0.35);
            osc.start(ctx.currentTime + startAt);
            osc.stop(ctx.currentTime + startAt + 0.35);
        };
        playTone(880, 0);
        playTone(1100, 0.18);
    } catch {
        // Silently fail if audio is blocked
    }
}

const mockNotifications: Notification[] = [
    {
        id: 'n-1',
        type: 'like',
        message: 'liked your post',
        actorName: 'Alex Chen',
        actorAvatar: 'https://ui-avatars.com/api/?name=Alex+Chen&background=6366f1&color=fff',
        href: '/feed',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 3),
    },
    {
        id: 'n-6',
        type: 'like',
        message: 'liked your post',
        actorName: 'Sarah Kim',
        actorAvatar: 'https://ui-avatars.com/api/?name=Sarah+Kim&background=ec4899&color=fff',
        href: '/feed',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 4),
    },
    {
        id: 'n-7',
        type: 'like',
        message: 'liked your post',
        actorName: 'Priya Patel',
        actorAvatar: 'https://ui-avatars.com/api/?name=Priya+Patel&background=f59e0b&color=fff',
        href: '/feed',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 5),
    },
    {
        id: 'n-2',
        type: 'comment',
        message: 'commented on your post: "Great work on this!"',
        actorName: 'Sarah Kim',
        actorAvatar: 'https://ui-avatars.com/api/?name=Sarah+Kim&background=ec4899&color=fff',
        href: '/feed',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 15),
    },
    {
        id: 'n-3',
        type: 'mention',
        message: 'mentioned you in a post',
        actorName: 'Mike Johnson',
        actorAvatar: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=10b981&color=fff',
        href: '/feed',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 45),
    },
    {
        id: 'n-4',
        type: 'tribe_invite',
        message: 'invited you to join the tribe "React Wizards"',
        actorName: 'Priya Patel',
        actorAvatar: 'https://ui-avatars.com/api/?name=Priya+Patel&background=f59e0b&color=fff',
        href: '/tribes',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
        id: 'n-5',
        type: 'follow',
        message: 'started following you',
        actorName: 'David Lee',
        actorAvatar: 'https://ui-avatars.com/api/?name=David+Lee&background=8b5cf6&color=fff',
        href: '/feed',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    },
];

export const useNotificationStore = create<NotificationState>((set) => ({
    isOpen: false,
    notifications: mockNotifications,

    toggleDropdown: () => set((state) => ({ isOpen: !state.isOpen })),
    closeDropdown: () => set({ isOpen: false }),

    markAsRead: (ids) =>
        set((state) => ({
            notifications: state.notifications.map((n) =>
                ids.includes(n.id) ? { ...n, isRead: true } : n
            ),
        })),

    markAllAsRead: () =>
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        })),

    dismiss: (ids) =>
        set((state) => ({
            notifications: state.notifications.filter((n) => !ids.includes(n.id)),
        })),

    addNotification: (notification) => {
        playNotificationSound();
        set((state) => ({ notifications: [notification, ...state.notifications] }));
    },
}));

// Simulate a live notification arriving after 8 seconds (demo only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    setTimeout(() => {
        useNotificationStore.getState().addNotification({
            id: `n-live-${Date.now()}`,
            type: 'follow',
            message: 'started following you',
            actorName: 'Emma Wilson',
            actorAvatar: 'https://ui-avatars.com/api/?name=Emma+Wilson&background=3b82f6&color=fff',
            href: '/feed',
            isRead: false,
            createdAt: new Date(),
        });
    }, 8000);
}