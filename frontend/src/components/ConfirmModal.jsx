import React from 'react';
import ReactDOM from 'react-dom';
import { AlertCircle } from 'lucide-react';

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

    const modalContent = (
        <div
            className="fixed top-0 left-0 right-0 bottom-0 z-[99999] animate-in fade-in duration-200"
            style={{
                position: 'fixed',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem'
            }}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0
                }}
            ></div>

            {/* Modal Content */}
            <div
                className="relative bg-neutral-900 border border-neutral-800 p-8 rounded-[2.5rem] w-full shadow-2xl animate-in zoom-in-95 duration-300"
                style={{
                    position: 'relative',
                    maxWidth: '24rem',
                    margin: '0 auto'
                }}
            >
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

    // Use React Portal to render modal at document.body level, outside of parent component hierarchy
    return ReactDOM.createPortal(modalContent, document.body);
};

export default ConfirmModal;
