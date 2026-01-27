import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Are you sure?",
    message = "This action cannot be undone.",
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    type = "danger" // 'danger', 'warning', 'info'
}) => {
    if (!isOpen) return null;

    const colors = {
        danger: {
            bg: "bg-red-500/10",
            icon: "text-red-500",
            button: "bg-red-600 hover:bg-red-500 shadow-red-500/20"
        },
        warning: {
            bg: "bg-amber-500/10",
            icon: "text-amber-500",
            button: "bg-amber-600 hover:bg-amber-500 shadow-amber-500/20"
        },
        info: {
            bg: "bg-blue-500/10",
            icon: "text-blue-500",
            button: "bg-blue-600 hover:bg-blue-500 shadow-blue-500/20"
        }
    };

    const color = colors[type] || colors.danger;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-neutral-900 border border-neutral-800 p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex flex-col items-center text-center">
                    <div className={`h-16 w-16 rounded-full ${color.bg} flex items-center justify-center mb-6 ${color.icon}`}>
                        <AlertCircle size={32} />
                    </div>

                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-3">
                        {title}
                    </h3>

                    <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] leading-relaxed mb-8">
                        {message}
                    </p>

                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-4 rounded-xl bg-neutral-800 text-neutral-400 font-black uppercase tracking-widest text-[10px] hover:bg-neutral-700 hover:text-white transition-all active:scale-95"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`flex-1 px-6 py-4 rounded-xl text-white font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-xl ${color.button}`}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
