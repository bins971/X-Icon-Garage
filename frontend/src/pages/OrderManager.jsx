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


    const [showArchived, setShowArchived] = useState(false);
    const [sortMode, setSortMode] = useState('NEWEST');

    const sortedOrders = [...filteredOrders].sort((a, b) => {
        if (sortMode === 'NEWEST') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortMode === 'OLDEST') return new Date(a.createdAt) - new Date(b.createdAt);
        if (sortMode === 'PENDING') {
            const priority = { NEW: 1, PENDING_PAYMENT: 1, PENDING: 2, PROCESSED: 3, SHIPPED: 4, COMPLETED: 5, CANCELLED: 6 };
            return (priority[a.status] || 99) - (priority[b.status] || 99);
        }
        if (sortMode === 'FILLED') {
            const priority = { COMPLETED: 1, DELIVERED: 1, SHIPPED: 2, PROCESSED: 3, NEW: 4, PENDING: 4, CANCELLED: 5 };
            return (priority[a.status] || 99) - (priority[b.status] || 99);
        }
        return 0;
    });

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/shop/orders?archived=${showArchived}`);
            setOrders(res.data);
        } catch (error) {
            console.error(error);
            notify.error(error.response?.data?.message || 'Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, [showArchived]);

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

    const requestArchive = (id, shouldArchive) => {
        setConfirmAction({
            id,
            isArchived: shouldArchive,
            type: 'ARCHIVE',
            title: shouldArchive ? 'Archive Order?' : 'Restore Order?',
            message: shouldArchive ? 'This order will be moved to the archival list.' : 'This order will be restored to the active list.',
            color: 'blue'
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
        const { id, status, type, isArchived } = confirmAction;
        try {
            if (type === 'DELETE') {
                await api.delete(`/shop/orders/${id}`);
                notify.success('Order removed successfully');
            } else if (type === 'ARCHIVE') {
                await api.patch(`/shop/orders/${id}`, { isArchived });
                notify.success(`Order ${isArchived ? 'archived' : 'restored'} successfully`);
            } else {
                await api.patch(`/shop/orders/${id}`, { status });
                notify.success(`Order marked as ${status.toLowerCase()}`);
            }
            fetchOrders();
        } catch (error) {
            notify.error(error.response?.data?.message || 'Action failed');
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
                <div className="flex gap-4 items-center">
                    <select
                        value={sortMode}
                        onChange={(e) => setSortMode(e.target.value)}
                        className="bg-slate-800 text-white text-sm font-bold rounded-xl px-4 py-2 outline-none border border-slate-700 focus:border-blue-500"
                    >
                        <option value="NEWEST">Newest First</option>
                        <option value="OLDEST">Oldest First</option>
                        <option value="PENDING">Pending First</option>
                        <option value="FILLED">Filled/Completed</option>
                    </select>

                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-widest transition-colors ${showArchived ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                        {showArchived ? 'Show Active' : 'Show Archived'}
                    </button>
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search..."
                        className="w-64"
                    />
                </div>
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
                    sortedOrders.map(order => (
                        <div key={order.id} className={`border border-slate-800 rounded-2xl p-6 relative overflow-hidden ${order.isArchived ? 'bg-slate-900/50 opacity-75' : 'bg-slate-900'}`}>
                            {order.isArchived && (
                                <div className="absolute top-0 right-0 bg-slate-800 text-slate-400 px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-widest border-l border-b border-slate-700">
                                    ARCHIVED
                                </div>
                            )}
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

                            <div className="flex gap-3 justify-end items-center">
                                {!order.isArchived && (
                                    <>
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
                                    </>
                                )}

                                <div className="h-8 w-px bg-slate-800 mx-2"></div>

                                <button
                                    onClick={() => requestArchive(order.id, !order.isArchived)}
                                    className={`p-2 rounded-lg transition-colors ${order.isArchived ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                                    title={order.isArchived ? "Restore to Active" : "Archive Order"}
                                >
                                    <Package size={18} className={order.isArchived ? "" : "opacity-70"} />
                                </button>

                                {(!['PAID', 'PROCESSING', 'PROCESSED', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(order.status) || order.isArchived) && (
                                    <button
                                        onClick={() => requestDelete(order.id)}
                                        className="p-2 bg-slate-800 hover:bg-red-500/10 hover:text-red-500 text-slate-400 rounded-lg transition-colors"
                                        title="Permanently Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
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
