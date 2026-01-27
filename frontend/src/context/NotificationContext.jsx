import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, X, Info, Zap } from 'lucide-react';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const showNotification = useCallback((type, message, duration = 4000) => {
        const id = Math.random().toString(36).substr(2, 9);
        setNotifications((prev) => {
            const current = [...prev];
            if (current.length >= 5) current.shift();
            return [...current, { id, type, message }];
        });

        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, duration);
    }, []);

    const notify = {
        success: (msg) => showNotification('SUCCESS', msg),
        error: (msg) => showNotification('ERROR', msg),
        info: (msg) => showNotification('INFO', msg),
        warning: (msg) => showNotification('WARNING', msg),
    };

    const removeNotification = (id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    const getTypeStyles = (type) => {
        switch (type) {
            case 'SUCCESS': return 'border-emerald-500/50 shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)] bg-neutral-900/95';
            case 'ERROR': return 'border-red-500/50 shadow-[0_0_30px_-10px_rgba(239,68,68,0.3)] bg-neutral-900/95';
            case 'WARNING': return 'border-amber-500/50 shadow-[0_0_30px_-10px_rgba(245,158,11,0.3)] bg-neutral-900/95';
            case 'INFO': return 'border-blue-500/50 shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)] bg-neutral-900/95';
            default: return 'border-neutral-800 bg-neutral-900';
        }
    };

    const getIconColor = (type) => {
        switch (type) {
            case 'SUCCESS': return 'text-emerald-500';
            case 'ERROR': return 'text-red-500';
            case 'WARNING': return 'text-amber-500';
            case 'INFO': return 'text-blue-500';
            default: return 'text-white';
        }
    };

    return (
        <NotificationContext.Provider value={notify}>
            {children}
            <div className="fixed top-6 right-6 z-[9999] flex flex-col items-end gap-3 w-full max-w-sm pointer-events-none p-4">
                {notifications.map((n) => (
                    <div
                        key={n.id}
                        className={`pointer-events-auto w-full flex items-start gap-4 p-5 rounded-2xl border backdrop-blur-3xl transition-all duration-500 animate-in slide-in-from-right-8 fade-in zoom-in-95 group hover:scale-[1.02] ${getTypeStyles(n.type)}`}
                        role="alert"
                    >
                        <div className={`p-2 rounded-xl bg-neutral-950/50 border border-white/5 shrink-0 ${getIconColor(n.type)}`}>
                            {n.type === 'SUCCESS' && <CheckCircle2 size={20} className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                            {n.type === 'ERROR' && <AlertCircle size={20} className="drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />}
                            {n.type === 'WARNING' && <Info size={20} className="drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />}
                            {n.type === 'INFO' && <Zap size={20} className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
                        </div>

                        <div className="flex-1 pt-1">
                            <h4 className={`text-xs font-black uppercase tracking-widest mb-1 ${getIconColor(n.type)} opacity-80`}>
                                {n.type}
                            </h4>
                            <p className="text-sm font-bold text-white/90 leading-relaxed">
                                {n.message}
                            </p>
                        </div>

                        <button
                            onClick={() => removeNotification(n.id)}
                            className="shrink-0 text-neutral-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1 rounded-lg"
                        >
                            <X size={14} />
                        </button>

                        {/* Animated Progress Line */}
                        <div className={`absolute bottom-0 left-0 h-[2px] w-full origin-left animate-toast-progress opacity-50 ${n.type === 'SUCCESS' ? 'bg-emerald-500' :
                                n.type === 'ERROR' ? 'bg-red-500' :
                                    n.type === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500'
                            }`} />
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
};
