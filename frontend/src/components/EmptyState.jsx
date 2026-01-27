import React from 'react';
import { AlertCircle } from 'lucide-react';

const EmptyState = ({
    icon: Icon = AlertCircle,
    title = "No data found",
    message = "We couldn't find anything matching your request.",
    action = null
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-[2.5rem] mb-6 shadow-2xl">
                <Icon size={48} className="text-neutral-700" />
            </div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-2">{title}</h3>
            <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] max-w-xs leading-relaxed">
                {message}
            </p>
            {action && (
                <div className="mt-8">
                    {action}
                </div>
            )}
        </div>
    );
};

export default EmptyState;
