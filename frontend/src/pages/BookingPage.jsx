import React, { useState } from 'react';
import { Calendar, Clock, User, MessageSquare, CheckCircle2, Loader2 } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import api from '../api/client';

const BookingPage = () => {
    const notify = useNotification();
    const [formData, setFormData] = useState({
        customerName: '',
        phone: '',
        email: '',
        date: '',
        serviceType: 'General Service',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [bookingRef, setBookingRef] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/bookings/public', formData);
            setBookingRef(res.data.bookingRef);
            setSuccess(true);
            notify.success('Booking request sent successfully!');
        } catch (error) {
            notify.error(error.response?.data?.message || 'Failed to book appointment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 max-w-md text-center animate-in zoom-in-95">
                    <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Booking Requested!</h2>
                    <p className="text-neutral-400 mb-6">Your appointment request has been received.</p>

                    <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl mb-6">
                        <p className="text-xs text-neutral-500 uppercase tracking-wider font-bold mb-1">Your Booking Reference</p>
                        <p className="text-2xl font-mono text-amber-400 tracking-widest select-all">{bookingRef}</p>
                        <p className="text-xs text-neutral-500 mt-2">Save this code to track your status.</p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <a href="/track" className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-4 rounded-xl transition-all active:scale-95 font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-600/10">
                            Track Status Now
                        </a>
                        <button
                            onClick={() => { setSuccess(false); setBookingRef(''); setFormData({ ...formData, customerName: '', date: '' }); }}
                            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-6 py-2 rounded-xl transition-colors"
                        >
                            Book Another
                        </button>
                    </div>
                    <a href="/" className="block mt-6 text-neutral-500 hover:text-white text-sm">Return Home</a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-white">Book an Appointment</h1>
                    <p className="text-neutral-400 mt-2">Schedule your visit with our expert mechanics.</p>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-2">Your Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 text-neutral-600" size={18} />
                                    <input
                                        type="text" required
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                        value={formData.customerName}
                                        onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-2">Phone Number</label>
                                <input
                                    type="tel" required
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-4 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-2">Email Address</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-neutral-600" size={18} />
                                <input
                                    type="email" required
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-2">Preferred Date & Time</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 text-neutral-600" size={18} />
                                    <input
                                        type="datetime-local" required
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-2">Service Type</label>
                                <select
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-4 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                    value={formData.serviceType}
                                    onChange={e => setFormData({ ...formData, serviceType: e.target.value })}
                                >
                                    <option>General Service</option>
                                    <option>Oil Change</option>
                                    <option>Engine Repair</option>
                                    <option>Brake Inspection</option>
                                    <option>Tire Service</option>
                                    <option>Home Service</option>
                                    <option>Other</option>
                                </select>
                            </div>
                        </div>

                        {formData.serviceType === 'Home Service' && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <label className="block text-sm font-medium text-neutral-400 mb-2">Home Address</label>
                                <input
                                    type="text" required
                                    placeholder="Enter your full home address"
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-4 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                    value={formData.address || ''}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-2">Notes / Issues</label>
                            <div className="relative">
                                <MessageSquare className="absolute left-3 top-3 text-neutral-600" size={18} />
                                <textarea
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-amber-500 outline-none h-24 resize-none"
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Describe any specific issues..."
                                ></textarea>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-amber-600 hover:bg-amber-400 text-white font-black py-4 rounded-xl transition-all shadow-xl shadow-amber-600/20 disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Confirm Booking'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BookingPage;
