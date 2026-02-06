import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Mail, Calendar, User, Phone, Box, Check, X, MessageSquare } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const InquiryList = () => {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedInquiry, setSelectedInquiry] = useState(null);
    const notify = useNotification();

    useEffect(() => {
        fetchInquiries();
    }, []);

    const fetchInquiries = async () => {
        try {
            const res = await api.get('/inquiries');
            setInquiries(res.data);
        } catch (error) {
            console.error(error);
            notify.error('Failed to load inquiries');
        } finally {
            setLoading(false);
        }
    };

    const getSmartDate = (dateString) => {
        if (!dateString) return 'N/A';

        let date;
        // Handle SQL timestamps (YYYY-MM-DD HH:MM:SS) by forcing UTC
        if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateString)) {
            date = new Date(dateString.replace(' ', 'T') + 'Z');
        } else {
            date = new Date(dateString);
        }

        if (isNaN(date.getTime())) return String(dateString);

        const now = new Date();
        const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();

        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (isToday) return `Today, ${timeStr}`;
        if (isYesterday) return `Yesterday, ${timeStr}`;

        return `${date.toLocaleDateString()} ${timeStr}`;
    };

    if (loading) return <div className="p-8 text-white">Loading inquiries...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Customer Inquiries</h1>
                <p className="text-neutral-400 text-sm mt-1">Review questions from the shop.</p>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-neutral-950/50 text-neutral-400 text-xs uppercase tracking-widest font-bold">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Content</th>
                                <th className="p-4">Reference</th>
                                <th className="p-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800 text-sm text-neutral-300">
                            {inquiries.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-neutral-500 italic">No inquiries found.</td>
                                </tr>
                            ) : (
                                inquiries.map((inq) => (
                                    <tr
                                        key={inq.id}
                                        onClick={() => setSelectedInquiry(inq)}
                                        className="hover:bg-neutral-800/50 transition-colors cursor-pointer group"
                                    >
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-neutral-400 group-hover:text-neutral-200">
                                                <Calendar size={14} className="text-amber-500" />
                                                <span className="text-xs font-mono">{getSmartDate(inq.createdAt)}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-white mb-1 flex items-center gap-2">
                                                <User size={14} className="text-emerald-500" /> {inq.customerName}
                                            </div>
                                            <div className="text-xs text-neutral-400 space-y-0.5">
                                                <div className="flex items-center gap-1"><Mail size={10} /> {inq.email}</div>
                                                {inq.phone && <div className="flex items-center gap-1"><Phone size={10} /> {inq.phone}</div>}
                                            </div>
                                        </td>
                                        <td className="p-4 max-w-sm">
                                            <div className="line-clamp-2 text-xs text-neutral-400 italic">
                                                "{inq.message}"
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {inq.partName ? (
                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-xs font-bold uppercase tracking-wide border border-amber-500/20">
                                                    <Box size={12} />
                                                    {inq.partName}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-neutral-600 uppercase tracking-widest font-bold">General</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-800 text-neutral-400 rounded text-[10px] font-bold uppercase group-hover:bg-neutral-700 transition">
                                                {inq.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View/Reply Modal */}
            {selectedInquiry && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-neutral-900 border border-neutral-800 w-full max-w-2xl rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-6 border-b border-neutral-800 flex justify-between items-start bg-neutral-950/50 rounded-t-2xl">
                            <div>
                                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Inquiry Details</h2>
                                <p className="text-neutral-400 text-xs font-mono mt-1 flex items-center gap-2">
                                    <Calendar size={12} className="text-amber-500" />
                                    Received: {getSmartDate(selectedInquiry.createdAt)}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedInquiry(null)}
                                className="p-2 bg-neutral-800 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 overflow-y-auto space-y-8 scrollbar-hide">

                            {/* Customer Info */}
                            <div className="bg-neutral-800/30 p-4 rounded-xl border border-neutral-800 flex items-center gap-6">
                                <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center text-emerald-500">
                                    <User size={24} />
                                </div>
                                <div>
                                    <p className="text-white font-bold text-lg">{selectedInquiry.customerName}</p>
                                    <div className="flex flex-wrap gap-4 mt-1 text-sm text-neutral-400">
                                        <span className="flex items-center gap-1"><Mail size={14} /> {selectedInquiry.email}</span>
                                        {selectedInquiry.phone && <span className="flex items-center gap-1"><Phone size={14} /> {selectedInquiry.phone}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Message */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                                    <MessageSquare size={14} className="text-amber-500" /> Customer Question
                                </h3>
                                <div className="bg-white/5 p-6 rounded-xl border border-white/10 text-neutral-200 leading-relaxed whitespace-pre-wrap">
                                    {selectedInquiry.message}
                                </div>
                            </div>

                            {/* Referenced Part */}
                            {selectedInquiry.partName && (
                                <div className="space-y-2 pt-4 border-t border-neutral-800">
                                    <h3 className="text-xs font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                                        <Box size={14} className="text-amber-500" /> Referenced Product
                                    </h3>
                                    <div className="flex gap-4 p-4 bg-neutral-950 rounded-xl border border-neutral-800 items-start">
                                        <div className="w-20 h-20 bg-neutral-800 rounded-lg flex items-center justify-center overflow-hidden border border-neutral-700 shrink-0">
                                            {selectedInquiry.partImage ? (
                                                <img src={selectedInquiry.partImage} alt="Part" className="w-full h-full object-cover" />
                                            ) : (
                                                <Box className="text-neutral-600" size={24} />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-lg">{selectedInquiry.partName}</p>
                                            {selectedInquiry.partNumber && <p className="text-xs text-neutral-500 font-mono mb-1">{selectedInquiry.partNumber}</p>}
                                            {selectedInquiry.partPrice && (
                                                <p className="text-emerald-500 font-black italic">₱{selectedInquiry.partPrice.toLocaleString()}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer / Actions */}
                        <div className="p-6 border-t border-neutral-800 bg-neutral-900/50 rounded-b-2xl flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedInquiry(null)}
                                className="px-6 py-3 rounded-xl bg-neutral-800 text-white font-bold text-xs uppercase tracking-widest hover:bg-neutral-700 transition-colors"
                            >
                                Close View
                            </button>
                            <a
                                href={`mailto:${selectedInquiry.email}?subject = Re: Inquiry about ${selectedInquiry.partName || 'Question'} `}
                                className="px-6 py-3 rounded-xl bg-amber-500 text-black font-black text-xs uppercase tracking-widest hover:bg-amber-400 transition-colors flex items-center gap-2"
                            >
                                <Mail size={16} /> Reply via Email
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InquiryList;
