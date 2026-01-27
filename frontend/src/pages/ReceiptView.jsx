import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Printer, Download, ArrowLeft, Wrench, CheckCircle2, Clock } from 'lucide-react';
import api from '../api/client';

const ReceiptView = () => {
    const { id } = useParams();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const res = await api.get(`/invoices/${id}`);
                setInvoice(res.data);
            } catch (err) {
                setError('Failed to load receipt details.');
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white font-black uppercase tracking-widest">Generating Digital Receipt...</div>;
    if (error) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-red-500 font-black uppercase tracking-widest">{error}</div>;

    const subtotal = invoice.subTotal || 0;
    const tax = invoice.tax || 0;
    const discount = invoice.discount || 0;
    const total = invoice.totalAmount || 0;

    return (
        <div className="min-h-screen bg-neutral-950 p-4 md:p-8 pt-24 font-sans text-neutral-200">
            <div className="max-w-4xl mx-auto">
                {/* Actions */}
                <div className="mb-8 flex justify-between items-center print:hidden">
                    <Link to="/dashboard/invoices" className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors uppercase font-black text-xs tracking-widest">
                        <ArrowLeft size={16} /> Back to Invoices
                    </Link>
                    <div className="flex gap-4">
                        <button onClick={handlePrint} className="bg-neutral-900 border border-neutral-800 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-neutral-800 transition-all flex items-center gap-2">
                            <Printer size={16} /> Print Receipt
                        </button>
                    </div>
                </div>

                {/* Receipt Paper */}
                <div className="bg-white text-black p-8 md:p-12 rounded-[2rem] shadow-2xl relative overflow-hidden border-t-[12px] border-amber-500">
                    {/* Watermark */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] rotate-[-25deg] pointer-events-none select-none">
                        <Wrench size={400} />
                    </div>

                    <div className="relative z-10">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row justify-between gap-8 mb-16 border-b border-neutral-100 pb-12">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-amber-500 p-2 rounded-xl">
                                        <Wrench size={24} className="text-black" />
                                    </div>
                                    <span className="text-2xl font-black tracking-tighter italic uppercase">X-ICON <span className="text-amber-500">GARAGE</span></span>
                                </div>
                                <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest leading-relaxed">
                                    Reliable Performance | Elite Workshop<br />
                                    Las Piñas City, Metro Manila<br />
                                    Tel: (555) 123-4567
                                </div>
                            </div>
                            <div className="text-left md:text-right">
                                <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none mb-2">OFFICIAL RECEIPT</h1>
                                <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">#{invoice.invoiceNumber}</p>
                                <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-widest">
                                    <CheckCircle2 size={12} /> {invoice.status}
                                </div>
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                            <div>
                                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-4">CLIENT DETAILS</h3>
                                <p className="text-lg font-black uppercase">{invoice.customerName}</p>
                                <p className="text-sm font-bold text-neutral-500 uppercase mt-1">{invoice.address || 'No Address Provided'}</p>
                                <p className="text-sm font-bold text-neutral-500 uppercase mt-1">{invoice.email}</p>
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-4">MACHINE SPECS</h3>
                                <p className="text-lg font-black uppercase italic">{invoice.make} {invoice.model}</p>
                                <p className="text-sm font-mono font-black text-amber-600 mt-1 uppercase">PLATE: {invoice.plateNumber}</p>
                                <p className="text-sm font-bold text-neutral-500 uppercase mt-1">JOB #: {invoice.jobNumber}</p>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-16">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b-2 border-neutral-900">
                                        <th className="py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Description</th>
                                        <th className="py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-center">Qty</th>
                                        <th className="py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right">Unit Price</th>
                                        <th className="py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm font-bold uppercase">
                                    {/* Labor/Service */}
                                    <tr className="border-b border-neutral-100">
                                        <td className="py-6">Labor & Professional Inspection</td>
                                        <td className="py-6 text-center">1</td>
                                        <td className="py-6 text-right">₱{(invoice.subTotal - invoice.parts.reduce((acc, p) => acc + (p.unitPrice * p.quantity), 0)).toLocaleString()}</td>
                                        <td className="py-6 text-right">₱{(invoice.subTotal - invoice.parts.reduce((acc, p) => acc + (p.unitPrice * p.quantity), 0)).toLocaleString()}</td>
                                    </tr>
                                    {/* Parts */}
                                    {invoice.parts.map((part, i) => (
                                        <tr key={i} className="border-b border-neutral-100">
                                            <td className="py-6">Genuine Part: {part.partName || 'Service Part'}</td>
                                            <td className="py-6 text-center">{part.quantity}</td>
                                            <td className="py-6 text-right">₱{part.unitPrice.toLocaleString()}</td>
                                            <td className="py-6 text-right">₱{(part.unitPrice * part.quantity).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary */}
                        <div className="flex justify-end border-t-2 border-neutral-900 pt-8">
                            <div className="w-full md:w-80 space-y-4">
                                <div className="flex justify-between text-neutral-500 font-bold uppercase text-xs tracking-widest">
                                    <span>Subtotal</span>
                                    <span>₱{subtotal.toLocaleString()}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-red-500 font-bold uppercase text-xs tracking-widest">
                                        <span>Discount</span>
                                        <span>- ₱{discount.toLocaleString()}</span>
                                    </div>
                                )}
                                {tax > 0 && (
                                    <div className="flex justify-between text-neutral-500 font-bold uppercase text-xs tracking-widest">
                                        <span>VAT/Tax</span>
                                        <span>₱{tax.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center bg-neutral-900 text-white p-6 rounded-2xl mt-8">
                                    <span className="text-xs font-black uppercase tracking-[0.2em]">Total Amount</span>
                                    <span className="text-3xl font-black italic tracking-tighter leading-none">₱{total.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-24 text-center">
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.4em] mb-4 italic">AUTHENTIC PERFORMANCE GUARANTEE</p>
                            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
                                Thank you for trusting X-ICON GARAGE. This digital receipt serves as your proof of ownership for genuine parts and labor warranty valid for 30 days.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceiptView;
