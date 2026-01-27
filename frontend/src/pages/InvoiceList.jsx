import React, { useState, useEffect } from 'react';
import { FileText, Plus, PhilippinePeso, Calendar, Eye, Download, Search, X, CreditCard, Banknote, Landmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useNotification } from '../context/NotificationContext';

const InvoiceList = () => {
    const notify = useNotification();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentData, setPaymentData] = useState({ amount: 0, method: 'CASH' });
    const [searchTerm, setSearchTerm] = useState('');

    const fetchInvoices = async () => {
        try {
            const res = await api.get('/invoices');
            setInvoices(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInvoices(); }, []);

    const openPaymentModal = (inv) => {
        setSelectedInvoice(inv);
        setPaymentData({ amount: inv.totalAmount, method: 'CASH' });
        setShowPaymentModal(true);
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/invoices/${selectedInvoice.id}/payments`, {
                amount: parseFloat(paymentData.amount),
                paymentMethod: paymentData.method
            });
            notify.success('Payment recorded successfully!');
            setShowPaymentModal(false);
            fetchInvoices();
        } catch (error) {
            notify.error(error.response?.data?.message || 'Failed to record payment');
        }
    };

    // Filtering Logic
    const filteredInvoices = invoices.filter(inv => {
        const search = searchTerm.toLowerCase();
        return (
            inv.invoiceNumber?.toLowerCase().includes(search) ||
            inv.customerName?.toLowerCase().includes(search) ||
            inv.plateNumber?.toLowerCase().includes(search) ||
            inv.jobNumber?.toLowerCase().includes(search)
        );
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500 p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Billing & Invoices</h1>
                    <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs mt-1">Manage client payments and digital receipts</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-3 text-neutral-600" size={18} />
                    <input
                        type="text"
                        placeholder="Search Invoice # or Client..."
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:ring-1 focus:ring-amber-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-neutral-950/50 text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-neutral-800">
                            <th className="px-8 py-5">Invoice #</th>
                            <th className="px-8 py-5">Customer / Plate</th>
                            <th className="px-8 py-5 text-center">Date</th>
                            <th className="px-8 py-5 text-right">Amount</th>
                            <th className="px-8 py-5 text-center">Status</th>
                            <th className="px-8 py-5 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                        {loading ? (
                            <tr><td colSpan="6" className="px-8 py-20 text-center text-neutral-500 font-black uppercase tracking-widest animate-pulse">Accessing Ledger...</td></tr>
                        ) : filteredInvoices.map(inv => (
                            <tr key={inv.id} className="hover:bg-neutral-800/30 transition-colors group">
                                <td className="px-8 py-6">
                                    <span className="font-black text-white tracking-widest uppercase text-xs">{inv.invoiceNumber}</span>
                                    <p className="text-[10px] text-neutral-600 mt-1 uppercase font-bold tracking-tighter">Ref: {inv.jobNumber}</p>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-col">
                                        <Link
                                            to={`/dashboard/customers/${inv.customerId}/history`}
                                            className="text-neutral-200 font-black uppercase text-xs hover:text-amber-500 transition-colors"
                                        >
                                            {inv.customerName}
                                        </Link>
                                        <span className="text-amber-500 font-mono text-[10px] mt-1">{inv.plateNumber}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <span className="text-neutral-500 text-xs font-bold uppercase">{new Date(inv.createdAt).toLocaleDateString()}</span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <span className="text-emerald-500 font-black tracking-widest text-sm italic">₱{inv.totalAmount.toLocaleString()}</span>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${inv.status === 'PAID'
                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                        }`}>
                                        {inv.status}
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex justify-center gap-3">
                                        <Link title="View Receipt" to={`/receipt/${inv.id}`} className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:border-white transition-all">
                                            <Eye size={16} />
                                        </Link>
                                        {inv.status !== 'PAID' && (
                                            <button
                                                onClick={() => openPaymentModal(inv)}
                                                title="Record Payment"
                                                className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-black transition-all"
                                            >
                                                <PhilippinePeso size={16} />
                                            </button>
                                        )}
                                        <button title="Download PDF" className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white transition-all">
                                            <Download size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!loading && invoices.length === 0 && (
                            <tr><td colSpan="6" className="px-8 py-16 text-center text-neutral-600 font-black uppercase tracking-widest text-xs">Awaiting first transaction</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)}></div>
                    <div className="relative bg-neutral-900 border border-neutral-800 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Record Payment</h3>
                                <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mt-1">Invoice: {selectedInvoice?.invoiceNumber}</p>
                            </div>
                            <button onClick={() => setShowPaymentModal(false)} className="p-2 bg-neutral-800 rounded-full text-neutral-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleRecordPayment} className="space-y-6">
                            <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800">
                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3 block">Payment Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-black text-xl italic">₱</span>
                                    <input
                                        type="number"
                                        required
                                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-4 pl-10 pr-4 text-2xl font-black text-white outline-none focus:border-emerald-500/50 transition-all italic"
                                        value={paymentData.amount}
                                        onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block">Collection Method</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { id: 'CASH', icon: <Banknote size={16} />, label: 'Cash' },
                                        { id: 'BANK', icon: <Landmark size={16} />, label: 'Bank' },
                                        { id: 'GCASH', icon: <CreditCard size={16} />, label: 'GCash' },
                                        { id: 'PAYMAYA', icon: <CreditCard size={16} />, label: 'PayMaya' }
                                    ].map(method => (
                                        <button
                                            key={method.id}
                                            type="button"
                                            onClick={() => setPaymentData({ ...paymentData, method: method.id })}
                                            className={`flex items-center gap-2 p-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${paymentData.method === method.id
                                                ? 'bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/20'
                                                : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                                                }`}
                                        >
                                            {method.icon} {method.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-xl uppercase tracking-widest text-xs transition-all shadow-xl shadow-emerald-500/10 active:scale-95">
                                Confrim & Record Payment
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoiceList;
