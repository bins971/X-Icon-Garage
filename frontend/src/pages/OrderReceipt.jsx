import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Printer, ArrowLeft, Package, CheckCircle2, Clock, MapPin, Phone, Mail } from 'lucide-react';
import api from '../api/client';

const OrderReceipt = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await api.get(`/shop/public/order/${id}`);
                setOrder(res.data);
            } catch (err) {
                setError('Failed to load order details.');
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white font-black uppercase tracking-widest">Loading Order Receipt...</div>;
    if (error) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-red-500 font-black uppercase tracking-widest">{error}</div>;

    return (
        <div className="min-h-screen bg-neutral-950 p-4 md:p-8 pt-24 font-sans text-neutral-200">
            <div className="max-w-4xl mx-auto">
                {/* Actions */}
                <div className="mb-8 flex justify-between items-center print:hidden">
                    <Link to="/shop" className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors uppercase font-black text-xs tracking-widest">
                        <ArrowLeft size={16} /> Back to Shop
                    </Link>
                    <button onClick={handlePrint} className="bg-neutral-900 border border-neutral-800 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-neutral-800 transition-all flex items-center gap-2">
                        <Printer size={16} /> Print Receipt
                    </button>
                </div>

                {/* Receipt Paper */}
                <div className="bg-white text-black p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden border-t-[12px] border-amber-500">
                    <div className="relative z-10">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row justify-between gap-8 mb-16 border-b border-neutral-100 pb-12">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-amber-500 p-2 rounded-xl">
                                        <Package size={24} className="text-black" />
                                    </div>
                                    <span className="text-2xl font-black tracking-tighter italic uppercase">X-ICON <span className="text-amber-500">SHOP</span></span>
                                </div>
                                <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest leading-relaxed">
                                    Genuine Parts | Elite Performance<br />
                                    Las Piñas City, Metro Manila
                                </div>
                            </div>
                            <div className="text-left md:text-right">
                                <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none mb-2">ORDER RECEIPT</h1>
                                <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">ORDER ID: {id.slice(0, 8)}...</p>
                                <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-widest">
                                    <Clock size={12} /> {order.status || 'PENDING'}
                                </div>
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                            <div>
                                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-4 text-left">CUSTOMER INFORMATION</h3>
                                <p className="text-lg font-black uppercase text-left">{order.customerName}</p>
                                <div className="mt-3 space-y-2 text-left">
                                    <p className="flex items-center gap-2 text-sm font-bold text-neutral-500">
                                        <Mail size={14} /> {order.email}
                                    </p>
                                    <p className="flex items-center gap-2 text-sm font-bold text-neutral-500">
                                        <Phone size={14} /> {order.phone}
                                    </p>
                                </div>
                            </div>
                            <div className="text-left md:text-right">
                                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-4">ORDER DETAILS</h3>
                                <p className="text-sm font-bold text-neutral-500 uppercase">DATE: {new Date(order.createdAt).toLocaleDateString()}</p>
                                <p className="text-sm font-bold text-neutral-500 uppercase mt-1">TIME: {new Date(order.createdAt).toLocaleTimeString()}</p>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-16">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b-2 border-neutral-900">
                                        <th className="py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Part Description</th>
                                        <th className="py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-center">Qty</th>
                                        <th className="py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right">Price</th>
                                        <th className="py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm font-bold uppercase">
                                    {order.items.map((item, i) => (
                                        <tr key={i} className="border-b border-neutral-100">
                                            <td className="py-6">{item.name}</td>
                                            <td className="py-6 text-center">{item.qty}</td>
                                            <td className="py-6 text-right">₱{item.price.toLocaleString()}</td>
                                            <td className="py-6 text-right">₱{(item.price * item.qty).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary */}
                        <div className="flex justify-end border-t-2 border-neutral-900 pt-8">
                            <div className="w-full md:w-80 space-y-4">
                                <div className="flex justify-between items-center bg-neutral-900 text-white p-6 rounded-2xl mt-8">
                                    <span className="text-xs font-black uppercase tracking-[0.2em]">Total Amount</span>
                                    <span className="text-3xl font-black italic tracking-tighter leading-none">₱{order.totalAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-24 text-center">
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.4em] mb-4 italic">X-ICON SUPREME SHOP</p>
                            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
                                Please present this receipt or Order ID ({id.slice(0, 8)}) for payment and claiming at the workshop.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderReceipt;
