import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle2, AlertCircle, X, Info, Zap, Bell, Shield } from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

const NotificationItem = ({ n, onRemove }) => {
    const [progress, setProgress] = useState(100);
    const [isPaused, setIsPaused] = useState(false);
    const duration = 5000;
    const timerRef = useRef(null);
    const startTimeRef = useRef(Date.now());
    const remainingRef = useRef(duration);

    useEffect(() => {
        if (isPaused) {
            clearInterval(timerRef.current);
            remainingRef.current -= Date.now() - startTimeRef.current;
        } else {
            startTimeRef.current = Date.now();
            timerRef.current = setInterval(() => {
                const elapsed = Date.now() - startTimeRef.current;
                const newProgress = ((remainingRef.current - elapsed) / duration) * 100;

                if (newProgress <= 0) {
                    clearInterval(timerRef.current);
                    onRemove(n.id);
                } else {
                    setProgress(newProgress);
                }
            }, 10);
        }
        return () => clearInterval(timerRef.current);
    }, [isPaused, n.id, onRemove]);

    const getTypeConfig = (type) => {
        switch (type) {
            case 'SUCCESS': return {
                color: 'text-emerald-400',
                border: 'border-emerald-500/20',
                bg: 'bg-emerald-500/5',
                glow: 'shadow-[0_0_40px_-10px_rgba(16,185,129,0.2)]',
                icon: <CheckCircle2 size={18} />,
                flare: 'from-emerald-500/20'
            };
            case 'ERROR': return {
                color: 'text-red-400',
                border: 'border-red-500/20',
                bg: 'bg-red-500/5',
                glow: 'shadow-[0_0_40px_-10px_rgba(239,68,68,0.2)]',
                icon: <AlertCircle size={18} />,
                flare: 'from-red-500/20'
            };
            case 'WARNING': return {
                color: 'text-amber-400',
                border: 'border-amber-500/20',
                bg: 'bg-amber-500/5',
                glow: 'shadow-[0_0_40_px_-10px_rgba(245,158,11,0.2)]',
                icon: <Shield size={18} />,
                flare: 'from-amber-500/20'
            };
            default: return {
                color: 'text-blue-400',
                border: 'border-blue-500/20',
                bg: 'bg-blue-500/5',
                glow: 'shadow-[0_0_40px_-10px_rgba(59,130,246,0.2)]',
                icon: <Zap size={18} />,
                flare: 'from-blue-500/20'
            };
        }
    };

    const config = getTypeConfig(n.type);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 50, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: 20, scale: 0.95, filter: 'blur(10px)', transition: { duration: 0.2 } }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className={`relative group pointer-events-auto w-full max-w-sm rounded-[1.5rem] border ${config.border} ${config.bg} backdrop-blur-2xl p-4 overflow-hidden mb-3 ${config.glow}`}
        >
            {/* Premium Flare Effect */}
            <div className={`absolute inset-0 bg-gradient-to-r ${config.flare} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 -translate-x-full group-hover:translate-x-full pointer-events-none`} />

            <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-xl bg-neutral-950/50 border border-white/5 ${config.color} shadow-inner`}>
                    {config.icon}
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-black tracking-[0.2em] uppercase ${config.color} opacity-60`}>
                            {n.type} SYSTEM
                        </span>
                        <button
                            onClick={() => onRemove(n.id)}
                            className="text-neutral-500 hover:text-white transition-colors p-1"
                        >
                            <X size={14} />
                        </button>
                    </div>
                    <p className="text-sm font-bold text-white/90 leading-snug">
                        {n.message}
                    </p>
                </div>
            </div>

            {/* Micro Progress Bar */}
            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-white/5">
                <motion.div
                    className={`h-full ${config.color.replace('text-', 'bg-')} opacity-40`}
                    style={{ width: `${progress}%` }}
                    transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
                />
            </div>
        </motion.div>
    );
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const showNotification = useCallback((type, message) => {
        const id = Math.random().toString(36).substr(2, 9);
        setNotifications((prev) => {
            // Group identical messages if they come in rapid succession
            if (prev.find(n => n.message === message)) return prev;

            const current = [...prev];
            if (current.length >= 4) current.shift();
            return [...current, { id, type, message }];
        });
    }, []);

    const notify = {
        success: (msg) => showNotification('SUCCESS', msg),
        error: (msg) => showNotification('ERROR', msg),
        info: (msg) => showNotification('INFO', msg),
        warning: (msg) => showNotification('WARNING', msg),
    };

    const removeNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={notify}>
            {children}
            <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[10000] flex flex-col items-center pointer-events-none w-full max-w-[24rem]">
                <LayoutGroup>
                    <AnimatePresence mode="popLayout">
                        {notifications.map((n) => (
                            <NotificationItem
                                key={n.id}
                                n={n}
                                onRemove={removeNotification}
                            />
                        ))}
                    </AnimatePresence>
                </LayoutGroup>
            </div>
        </NotificationContext.Provider>
    );
};
