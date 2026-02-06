import React, { useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { X } from 'lucide-react';
import api from '../api/client';

const InquiryModal = ({ part, isOpen, onClose }) => {
    const notify = useNotification();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        customerName: '',
        email: '',
        phone: '',
        message: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.customerName || !form.email || !form.message) {
            notify.error('Please fill in required fields');
            return;
        }

        setLoading(true);
        try {
            await api.post('/inquiries', {
                ...form,
                partId: part?.id || null,
                partName: part?.name || null
            });
            notify.success('Inquiry sent! We will reply shortly.');
            onClose();
            setForm({ customerName: '', email: '', phone: '', message: '' });
        } catch (error) {
            console.error(error);
            notify.error('Failed to send inquiry.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-neutral-900 border border-neutral-800 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-black text-white italic uppercase">Ask a Question</h3>
                        {part && <p className="text-amber-500 text-xs font-bold uppercase tracking-widest mt-1">Re: {part.name}</p>}
                        {!part && <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-1">General Inquiry</p>}
                    </div>
                    <button onClick={onClose} className="bg-neutral-800 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            placeholder="Your Name *"
                            className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-sm text-white focus:border-amber-500 outline-none transition-colors"
                            value={form.customerName}
                            onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                        />
                    </div>
                    <div>
                        <input
                            type="email"
                            placeholder="Email Address *"
                            className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-sm text-white focus:border-amber-500 outline-none transition-colors"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <input
                            type="tel"
                            placeholder="Phone Number (Optional)"
                            className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-sm text-white focus:border-amber-500 outline-none transition-colors"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        />
                    </div>
                    <div>
                        <textarea
                            placeholder="Your Message / Question *"
                            rows={4}
                            className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-sm text-white focus:border-amber-500 outline-none transition-colors resize-none"
                            value={form.message}
                            onChange={(e) => setForm({ ...form, message: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white hover:bg-neutral-200 text-black font-black py-4 rounded-xl uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg mt-2"
                    >
                        {loading ? 'Sending...' : 'Submit Inquiry'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default InquiryModal;
