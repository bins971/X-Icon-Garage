import React, { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle, XCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import api from '../api/client';
import useSearch from '../hooks/useSearch';
import SearchBar from '../components/SearchBar';
import EmptyState from '../components/EmptyState';
import { CardSkeleton } from '../components/Skeleton';
import ConfirmModal from '../components/ConfirmModal';



const OrderManager = () => {
    const notify = useNotification();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { searchTerm, setSearchTerm, filteredData: filteredOrders } = useSearch(orders, [
        'customerName', 'email', 'phone'
    ]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get('/shop/orders');
            setOrders(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
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

    const requestDelete = (id) => {
        setConfirmAction({
            id,
            type: 'DELETE',
            title: 'Delete Order?',
            message: 'Are you sure you want to permanently delete this order? This cannot be undone.',
            color: 'red'
        });
    };

    const confirmUpdate = async () => {
        if (!confirmAction) return;
        const { id, status, type } = confirmAction;
        try {
            if (type === 'DELETE') {
                await api.delete(`/shop/orders/${id}`);
                notify.success('Order removed successfully');
            } else {
                await api.patch(`/shop/orders/${id}`, { status });
                notify.success(`Order marked as ${status.toLowerCase()}`);
            }
            fetchOrders();
        } catch (error) {
            notify.error('Action failed');
        } finally {
            setConfirmAction(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tighter uppercase italic">Online Orders</h1>
                    <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs mt-1">Manage e-commerce sales and shipping</p>
                </div>
                <SearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search by customer, email..."
                    className="w-full md:w-64"
                />
            </div>

            <div className="space-y-4">
                {loading ? (
                    <CardSkeleton count={4} />
                ) : filteredOrders.length === 0 ? (
                    <EmptyState
                        icon={Package}
                        title="No Orders Found"
                        message={searchTerm ? `No results match "${searchTerm}"` : "Awaiting your first online sale."}
                    />
                ) : (
                    filteredOrders.map(order => (
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

                                <button
                                    onClick={() => requestDelete(order.id)}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-red-500/10 hover:text-red-500 text-slate-400 rounded-xl text-sm font-medium transition-colors ml-2"
                                    title="Remove Order"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <ConfirmModal
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={confirmUpdate}
                title={confirmAction?.title}
                message={confirmAction?.message}
                type={confirmAction?.color === 'red' ? 'danger' : confirmAction?.color === 'emerald' ? 'info' : 'info'}
                confirmLabel={confirmAction?.type === 'DELETE' ? 'Yes, Delete' : confirmAction?.status === 'CANCELLED' ? 'Yes, Cancel Order' : 'Yes, Update'}
            />
        </div >
    );
};

export default OrderManager;
