import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Rocket, Flame, HeartHandshake } from 'lucide-react';
import { ReactionType } from '@/stores/postStore';
import clsx from 'clsx';
import { useState, useRef } from 'react';

const REACTIONS: { type: ReactionType; icon: any; color: string; label: string; emoji: string }[] = [
    { type: 'like', icon: Heart, color: 'text-red-500', label: 'Like', emoji: '👍' },
    { type: 'useful', icon: Rocket, color: 'text-blue-500', label: 'Useful', emoji: '🚀' },
    { type: 'trending', icon: Flame, color: 'text-orange-500', label: 'Trending', emoji: '🔥' },
    { type: 'support', icon: HeartHandshake, color: 'text-pink-500', label: 'Support', emoji: '❤️' },
];

interface ReactionPickerProps {
    userReaction: ReactionType | null;
    reactionsSummary: Record<string, number>;
    onSelect: (type: ReactionType) => void;
}

export function ReactionPicker({ userReaction, reactionsSummary, onSelect }: ReactionPickerProps) {
    const [showPicker, setShowPicker] = useState(false);
    const timeoutRef = useRef<any>(null);

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        // Reduced delay to 200ms for more responsive feel
        timeoutRef.current = setTimeout(() => setShowPicker(true), 200);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setShowPicker(false), 300);
    };

    const totalReactions = Object.values(reactionsSummary).reduce((a, b) => a + b, 0);

    const activeReaction = REACTIONS.find(r => r.type === userReaction);

    return (
        <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <AnimatePresence>
                {showPicker && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="absolute bottom-full left-0 mb-2 bg-white dark:bg-charcoal-800 shadow-xl border border-grey-200 dark:border-charcoal-700 rounded-full px-2 py-1.5 flex gap-1 z-50 overflow-hidden"
                    >
                        {REACTIONS.map((r, i) => (
                            <motion.button
                                key={r.type}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ scale: 1.3, y: -5 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelect(r.type);
                                    setShowPicker(false);
                                }}
                                onMouseDown={(e) => e.stopPropagation()} // Extra safety for quick clicks
                                className={clsx(
                                    "p-2 rounded-full hover:bg-grey-100 dark:hover:bg-charcoal-700 transition-colors flex flex-col items-center gap-0.5 group",
                                    userReaction === r.type && "bg-grey-100 dark:bg-charcoal-700"
                                )}
                                title={r.label}
                            >
                                <span className="text-xl leading-none">{r.emoji}</span>
                                <span className="text-[10px] scale-0 group-hover:scale-100 transition-transform font-bold dark:text-grey-300">{r.label}</span>
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect(userReaction || 'like');
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className={clsx(
                    "flex items-center gap-1.5 px-3 py-2 rounded-full transition-all duration-200 group/btn",
                    userReaction
                        ? "bg-primary-500/10 text-primary-500 dark:text-primary-400"
                        : "text-grey-500 hover:text-charcoal-900 dark:hover:text-white hover:bg-grey-100 dark:hover:bg-charcoal-800"
                )}
            >
                {activeReaction ? (
                    <span className="text-lg animate-in zoom-in duration-200">{activeReaction.emoji}</span>
                ) : (
                    <Heart className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                )}

                <div className="flex -space-x-1.5 overflow-hidden">
                    {Object.entries(reactionsSummary)
                        .filter(([type, count]) => {
                            return count > 0 && type !== userReaction;
                        })
                        .slice(0, 3)
                        .map(([type]) => {
                            const r = REACTIONS.find(res => res.type === type);
                            return (
                                <span key={type} className="inline-block text-xs border border-white dark:border-charcoal-900 rounded-full bg-grey-50 dark:bg-charcoal-800 leading-none p-0.5">
                                    {r?.emoji}
                                </span>
                            );
                        })
                    }
                </div>

                <span className="text-xs font-bold leading-none">
                    {totalReactions > 0 ? totalReactions : (userReaction ? '' : 'React')}
                </span>
            </button>
        </div>
    );
}
