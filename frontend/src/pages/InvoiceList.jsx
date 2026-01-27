import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Calendar, User, MoreVertical, FileText, Wallet, PhilippinePeso, Trash2, X, CreditCard, Eye, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useNotification } from '../context/NotificationContext';
import PaymentModal from '../components/PaymentModal';
import useSearch from '../hooks/useSearch';
import SearchBar from '../components/SearchBar';
import { ListSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

const InvoiceList = () => {
    const notify = useNotification();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const { searchTerm, setSearchTerm, filteredData: filteredInvoices } = useSearch(invoices, [
        'invoiceNumber', 'customerName', 'plateNumber', 'jobNumber'
    ]);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const res = await api.get('/invoices');
            setInvoices(res.data);
        } catch (error) {
            console.error(error);
            notify.error('Failed to load invoices');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handleRecordPayment = (invoice) => {
        setSelectedInvoice(invoice);
        setShowPaymentModal(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Billing & Invoices</h1>
                    <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs mt-1">Manage client payments and digital receipts</p>
                </div>
                <SearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search invoice, client, or plate..."
                    className="flex-1 max-w-md"
                />
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
                            <tr><td colSpan="6" className="px-8 py-8"><ListSkeleton count={6} height="h-24" /></td></tr>
                        ) : filteredInvoices.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-8 py-0">
                                    <EmptyState
                                        icon={FileText}
                                        title="No Invoices Found"
                                        message={searchTerm ? `No invoices match "${searchTerm}"` : "Awaiting your first generated transaction."}
                                    />
                                </td>
                            </tr>
                        ) : (
                            filteredInvoices.map(inv => (
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
                                    <td className="px-8 py-6 text-center">
                                        <div className="flex justify-center gap-3">
                                            <Link title="View Receipt" to={`/receipt/${inv.id}`} className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:border-white transition-all">
                                                <Eye size={16} />
                                            </Link>
                                            {inv.status !== 'PAID' && (
                                                <button
                                                    onClick={() => handleRecordPayment(inv)}
                                                    title="Record Payment"
                                                    className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-black transition-all"
                                                >
                                                    <Wallet size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showPaymentModal && selectedInvoice && (
                <PaymentModal
                    invoice={selectedInvoice}
                    onClose={() => setShowPaymentModal(false)}
                    onSuccess={() => {
                        setShowPaymentModal(false);
                        fetchInvoices();
                    }}
                />
            )}
        </div>
    );
};

export default InvoiceList;
