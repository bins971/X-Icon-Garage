import React, { useState, useEffect } from 'react';
import { Plus, Search, Mail, Phone, MapPin, Trash2, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import api from '../api/client';

const CustomerList = () => {
    const [customers, setCustomers] = useState([]);
    const [showModal, setShowModal] = useState(false);

    const fetchCustomers = async () => {
        const res = await api.get('/customers');
        setCustomers(res.data);
    };

    useEffect(() => { fetchCustomers(); }, []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Customers</h1>
                <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all active:scale-95 font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/10">
                    <Plus size={20} /> New Customer
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customers.map(c => (
                    <div key={c.id} className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 p-6 rounded-[2rem] hover:border-amber-500/30 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-black text-white tracking-tight uppercase italic">{c.name}</h3>
                                <div className="h-1 w-12 bg-amber-500 mt-2 rounded-full"></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Link to={`/dashboard/customers/${c.id}/history`} className="text-neutral-600 hover:text-amber-500 transition-colors" title="View Ledger & History">
                                    <FileText size={16} />
                                </Link>
                                <button onClick={() => {
                                    // Logic to edit or delete could go here
                                }} className="text-neutral-600 hover:text-red-500 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 bg-neutral-950 p-3 rounded-xl border border-neutral-800/50">
                                <div className="p-2 bg-neutral-900 rounded-lg text-amber-500">
                                    <Mail size={16} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Email Address</span>
                                    <span className="text-sm font-bold text-white max-w-[200px] truncate">{c.email || 'N/A'}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 bg-neutral-950 p-3 rounded-xl border border-neutral-800/50">
                                <div className="p-2 bg-neutral-900 rounded-lg text-amber-500">
                                    <Phone size={16} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Phone Number</span>
                                    <span className="text-sm font-bold text-white">{c.phone || 'N/A'}</span>
                                </div>
                            </div>

                            {c.address && (
                                <div className="flex items-center gap-3 bg-neutral-950 p-3 rounded-xl border border-neutral-800/50">
                                    <div className="p-2 bg-neutral-900 rounded-lg text-amber-500">
                                        <MapPin size={16} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Location</span>
                                        <span className="text-xs font-bold text-neutral-300 line-clamp-1">{c.address}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <CustomerModal onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); fetchCustomers(); }} />
            )}
        </div>
    );
};

const CustomerModal = ({ onClose, onSuccess }) => {
    const notify = useNotification();
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/customers', formData);
            notify.success('Customer profile created');
            onSuccess();
        } catch (error) {
            notify.error('Error creating customer');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md animate-in zoom-in-95">
                <h2 className="text-xl font-bold text-white mb-6">Add Customer</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Name" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white"
                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    <input type="email" placeholder="Email" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white"
                        value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    <input type="text" placeholder="Phone" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white"
                        value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                    <textarea placeholder="Address" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white"
                        value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                    <div className="flex gap-4">
                        <button type="button" onClick={onClose} className="flex-1 bg-slate-800 text-white py-2 rounded-xl">Cancel</button>
                        <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-lg shadow-blue-500/10">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomerList;
