import React, { useState } from 'react';
import { X, Banknote, Landmark, CreditCard, PhilippinePeso } from 'lucide-react';
import api from '../api/client';
import { useNotification } from '../context/NotificationContext';

const PaymentModal = ({ invoice, onClose, onSuccess }) => {
    const notify = useNotification();
    const [loading, setLoading] = useState(false);
    const [paymentData, setPaymentData] = useState({
        amount: invoice.totalAmount,
        method: 'CASH',
        reference: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post(`/invoices/${invoice.id}/payments`, {
                amount: parseFloat(paymentData.amount),
                paymentMethod: paymentData.method,
                referenceNumber: paymentData.reference
            });
            notify.success('Payment recorded successfully!');
            onSuccess();
        } catch (error) {
            console.error(error);
            notify.error(error.response?.data?.message || 'Failed to record payment');
        } finally {
            setLoading(false);
        }
    };

    const paymentMethods = [
        { id: 'CASH', icon: <Banknote size={16} />, label: 'Cash' },
        { id: 'BANK', icon: <Landmark size={16} />, label: 'Bank' },
        { id: 'GCASH', icon: <CreditCard size={16} />, label: 'GCash' },
        { id: 'PAYMAYA', icon: <CreditCard size={16} />, label: 'PayMaya' }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-neutral-900 border border-neutral-800 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Record Payment</h3>
                        <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mt-1">Invoice: {invoice.invoiceNumber}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-neutral-800 rounded-full text-neutral-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
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
                            {paymentMethods.map(method => (
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

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block">Reference / Memo</label>
                        <input
                            type="text"
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 px-4 text-xs text-white placeholder:text-neutral-700 outline-none focus:border-neutral-600 transition-all"
                            placeholder="Optional reference number..."
                            value={paymentData.reference}
                            onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-black py-4 rounded-xl uppercase tracking-widest text-xs transition-all shadow-xl shadow-emerald-500/10 active:scale-95"
                    >
                        {loading ? 'Processing...' : 'Confirm & Record Payment'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PaymentModal;
