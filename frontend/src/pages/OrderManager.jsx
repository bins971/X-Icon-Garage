import React, { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import api from '../api/client';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, actionLabel, color = 'blue' }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${color === 'red' ? 'bg-red-500/10 text-red-500' :
                    color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
                    }`}>
                    <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-neutral-400 text-sm mb-6">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors">Cancel</button>
                    <button onClick={onConfirm} className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white transition-all shadow-lg ${color === 'red' ? 'bg-red-600 hover:bg-red-500 shadow-red-600/20' :
                        color === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
                        }`}>{actionLabel || 'Confirm'}</button>
                </div>
            </div>
        </div>
    );
};

const OrderManager = () => {
    const notify = useNotification();
    const [orders, setOrders] = useState([]);

    const fetchOrders = async () => {
        try {
            const res = await api.get('/shop/orders');
            setOrders(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => { fetchOrders(); }, []);

    const [confirmAction, setConfirmAction] = useState(null);

    const requestUpdate = (id, status) => {
        setConfirmAction({
            id,
            status,
            title: `Mark as ${status}?`,
            message: `Are you sure you want to update this order status? This will notify the customer.`,
            color: status === 'CANCELLED' ? 'red' : status === 'COMPLETED' ? 'emerald' : 'blue'
        });
    };

    const confirmUpdate = async () => {
        if (!confirmAction) return;
        const { id, status } = confirmAction;
        try {
            await api.patch(`/shop/orders/${id}`, { status });
            notify.success(`Order marked as ${status.toLowerCase()}`);
            fetchOrders();
        } catch (error) {
            notify.error('Failed to update order status');
        } finally {
            setConfirmAction(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold text-white">Online Orders</h1>

            <div className="space-y-4">
                {orders.map(order => (
                    <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <div className="flex justify-between items-start border-b border-slate-800 pb-4 mb-4">
                            <div>
                                <h3 className="font-bold text-white text-lg">{order.customerName}</h3>
                                <p className="text-slate-500 text-sm">{order.email} • {order.phone}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-emerald-500 font-bold text-xl">₱{order.totalAmount}</p>
                                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold border ${order.status === 'NEW' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                    order.status === 'PROCESSED' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                                        order.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                            'bg-red-500/10 text-red-500 border-red-500/20'
                                    }`}>
                                    {order.status}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2 mb-6">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm text-slate-400">
                                    <span>{item.qty}x {item.name}</span>
                                    <span>₱{(item.price * item.qty).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3 justify-end">
                            {order.status === 'NEW' && (
                                <button
                                    onClick={() => requestUpdate(order.id, 'PROCESSED')}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors"
                                >
                                    <Package size={16} /> Process Order
                                </button>
                            )}
                            {order.status === 'PROCESSED' && (
                                <button
                                    onClick={() => requestUpdate(order.id, 'COMPLETED')}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors"
                                >
                                    <Truck size={16} /> Mark Shipped
                                </button>
                            )}
                            {(order.status === 'NEW' || order.status === 'PROCESSED') && (
                                <button
                                    onClick={() => requestUpdate(order.id, 'CANCELLED')}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-red-500/10 hover:text-red-500 text-slate-400 rounded-xl text-sm font-medium transition-colors"
                                >
                                    <XCircle size={16} /> Cancel
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {orders.length === 0 && (
                    <div className="text-center py-12 text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                        No active orders.
                    </div>
                )}
            </div>
            <ConfirmationModal
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={confirmUpdate}
                title={confirmAction?.title}
                message={confirmAction?.message}
                color={confirmAction?.color}
                actionLabel={confirmAction?.status === 'CANCELLED' ? 'Yes, Cancel Order' : 'Yes, Update'}
            />
        </div >
    );
};

export default OrderManager;
