import { useState, useEffect } from 'react';
import { CheckCircle, Clock, Mail, Phone, User, AlertCircle, Package, Truck, Trash2, XCircle, ChevronDown, Archive } from 'lucide-react';
import api from '../api/client';
import { useNotification } from '../context/NotificationContext';
import ConfirmModal from '../components/ConfirmModal';

const OrderCard = ({ order = {}, updateTracking, deleteOrder, confirmPayment, markCompleted, processing, formatDate, getStatusColor, requestArchive }) => {
    const [expanded, setExpanded] = useState(false);
    const [localTracking, setLocalTracking] = useState({ courier: 'LBC', number: '' });

    const toggle = () => setExpanded(!expanded);

    // Safety checks for required fields to prevent crashes
    const status = order?.status || 'UNKNOWN';
    const id = order?.id || '########';
    const amount = typeof order?.totalAmount === 'number' ? order.totalAmount : 0;
    const paymentMethod = order?.paymentMethod || 'N/A';

    return (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 hover:border-amber-500/50 transition-all mb-4 overflow-hidden">
            <div className="p-4 md:p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-black uppercase tracking-widest ${getStatusColor ? getStatusColor(status) : 'text-neutral-500'}`}>
                                {status.replace('_', ' ')}
                            </span>
                            <span className="text-xs font-bold text-neutral-600">#{id.toString().slice(0, 8)}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-neutral-400">
                            <div className="flex items-center gap-1">
                                <Clock size={14} />
                                <span>
                                    {(status === 'PENDING_PAYMENT' || status === 'PENDING') && formatDate
                                        ? formatDate(order.createdAt)
                                        : (formatDate ? `Updated: ${formatDate(order.updatedAt || order.createdAt)}` : '')}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex justify-end gap-2 mb-1">
                            <button
                                onClick={() => requestArchive(order.id, !order.isArchived)}
                                className={`transition-colors p-1 rounded-md ${order.isArchived ? 'bg-blue-500/20 text-blue-500' : 'text-neutral-600 hover:text-blue-500'}`}
                                title={order.isArchived ? "Restore Order" : "Archive Order"}
                            >
                                <Archive size={16} />
                            </button>
                            <button
                                onClick={() => deleteOrder(order.id)}
                                className="text-neutral-600 hover:text-red-500 transition-colors p-1"
                                title="Delete Order"
                            >
                                <Trash2 size={16} />
                            </button>
                            <button
                                onClick={toggle}
                                className={`text-neutral-500 hover:text-white transition-colors p-1 ${expanded ? 'rotate-180' : ''}`}
                                title="View Details"
                            >
                                <ChevronDown size={16} />
                            </button>
                        </div>
                        <div className="text-xl font-black text-white">₱{amount.toLocaleString()}</div>
                        <div className="text-xs text-neutral-500 font-bold uppercase">{paymentMethod}</div>
                    </div>
                </div>

                {/* Collapsible Content */}
                {expanded && (
                    <div className="animate-in slide-in-from-top-2 duration-200">
                        {/* Order Items */}
                        <div className="space-y-2 mb-4 bg-neutral-950/30 p-3 rounded-lg border border-neutral-800/50">
                            <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Items</div>
                            {Array.isArray(order.items) && order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-xs text-neutral-400">
                                    <span>{item.qty}x {item.name}</span>
                                    <span className="font-mono">₱{(item.price * item.qty).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>

                        {/* Customer & Shipping Info */}
                        <div className="grid gap-4 mb-4 p-4 bg-neutral-950/50 rounded-xl">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-neutral-300">
                                    <User size={14} className="text-neutral-500 shrink-0" />
                                    <span className="font-bold truncate">{order.customerName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-neutral-400">
                                    <Mail size={14} className="text-neutral-500 shrink-0" />
                                    <span className="break-all">{order.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-neutral-400">
                                    <Phone size={14} className="text-neutral-500 shrink-0" />
                                    <span>{order.phone}</span>
                                </div>
                            </div>

                            {/* Shipping Address Display */}
                            {order.deliveryMethod === 'DELIVERY' ? (
                                <div className="space-y-1 border-l-2 border-amber-500/30 pl-3 pt-2 border-t border-t-neutral-800/50 md:border-t-0 md:pt-0">
                                    <div className="flex items-center gap-2 text-xs font-black text-amber-500 uppercase tracking-wider mb-1">
                                        <Truck size={14} /> Delivery Address
                                    </div>
                                    <p className="text-sm text-white break-words">{order.shippingAddress}</p>
                                    <p className="text-xs text-neutral-400">{order.shippingCity}, {order.shippingProvince} {order.shippingPostal}</p>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 h-full text-neutral-500 text-sm pt-2 border-t border-t-neutral-800/50 md:border-t-0 md:pt-0">
                                    <Package size={16} />
                                    <span>Store Pickup</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Actions: Pending Payment / Confirmation */}
                {(order.status === 'PENDING_PAYMENT' || order.status === 'PENDING') && (
                    <button
                        onClick={() => confirmPayment(order.id)}
                        disabled={processing === order.id}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                    >
                        {processing === order.id ? 'Confirming...' : <><CheckCircle size={18} /> {order.status === 'PENDING' ? 'Confirm Order' : 'Confirm Payment'}</>}
                    </button>
                )}

                {/* Actions: Processing / Ready to Ship - ONLY SHOW IF PROCESSING AND DELIVERY */}
                {order.status === 'PROCESSING' && order.deliveryMethod === 'DELIVERY' && (
                    <div className="bg-neutral-800/50 p-3 rounded-xl space-y-2 mt-3">
                        <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Update Tracking</div>
                        <div className="flex flex-wrap gap-2">
                            <select
                                className="bg-neutral-900 border border-neutral-700 text-white text-xs rounded-lg px-2 py-2 outline-none focus:border-amber-500 w-20 flex-shrink-0"
                                onChange={e => setLocalTracking({ ...localTracking, courier: e.target.value })}
                                value={localTracking.courier}
                            >
                                {['LBC', 'J&T', 'Grab', 'Other'].map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <input
                                type="text"
                                placeholder="Tracking #"
                                className="flex-1 bg-neutral-900 border border-neutral-700 text-white text-xs rounded-lg px-3 py-2 outline-none focus:border-amber-500 min-w-0"
                                onChange={e => setLocalTracking({ ...localTracking, number: e.target.value })}
                                value={localTracking.number}
                            />
                            <button
                                onClick={() => updateTracking(order.id, localTracking.courier, localTracking.number)}
                                disabled={processing === order.id}
                                className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-colors whitespace-nowrap"
                            >
                                {processing === order.id ? '...' : 'Update'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Actions: Processing / Ready for Pickup (For PICKUP orders) */}
                {order.status === 'PROCESSING' && order.deliveryMethod !== 'DELIVERY' && (
                    <div className="bg-neutral-800/50 p-4 rounded-xl space-y-3 mt-4">
                        <div className="text-xs font-black text-neutral-400 uppercase tracking-widest">Store Pickup</div>
                        <button
                            onClick={() => markCompleted(order.id)}
                            disabled={processing === order.id}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {processing === order.id ? 'Updating...' : <><CheckCircle size={16} /> Mark as Picked Up</>}
                        </button>
                    </div>
                )}

                {/* Actions: Shipped */}
                {order.status === 'SHIPPED' && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center gap-3 mt-4">
                        <Truck size={18} className="text-emerald-500" />
                        <div>
                            <div className="text-xs font-bold text-emerald-500 uppercase">Shipped via {order.courierName}</div>
                            <div className="text-sm text-white font-mono">{order.trackingNumber}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function PendingPayments() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null); // ID of order being processed
    const [trackingInput, setTrackingInput] = useState({ courier: 'LBC', number: '' });
    const [modalConfig, setModalConfig] = useState({ isOpen: false });
    const notify = useNotification();

    const [showArchived, setShowArchived] = useState(false);
    const [sortMode, setSortMode] = useState('NEWEST');

    useEffect(() => {
        console.log("PendingPayments: Component Mounted");
        fetchOrders();
    }, [showArchived]);

    const fetchOrders = async () => {
        try {
            const { data } = await api.get(`/admin/orders?archived=${showArchived}`);
            // Safeguard: Ensure data is an array
            if (Array.isArray(data)) {
                setOrders(data);
            } else {
                console.error("API returned non-array data for orders:", data);
                setOrders([]);
            }
        } catch (error) {
            console.error(error);
            notify.error('Failed to load orders');
            setOrders([]); // Fallback to empty array
        } finally {
            setLoading(false);
        }
    };

    const requestArchive = async (orderId, shouldArchive) => {
        setProcessing(orderId);
        try {
            await api.patch(`/admin/orders/${orderId}`, { isArchived: shouldArchive });
            notify.success(`Order ${shouldArchive ? 'archived' : 'restored'} successfully`);
            fetchOrders();
        } catch (error) {
            notify.error('Failed to update archive status');
        } finally {
            setProcessing(null);
        }
    };

    const confirmPayment = (orderId) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        const isCash = order?.paymentMethod === 'CASH' || order?.paymentMethod === 'COD';

        setModalConfig({
            isOpen: true,
            title: isCash ? "Confirm Order?" : "Confirm Payment?",
            message: isCash
                ? "This will confirm the order and move it to processing. Proceed?"
                : "Confirm that payment has been received? This cannot be undone.",
            type: "warning",
            confirmLabel: "Confirm",
            onConfirm: async () => {
                setProcessing(orderId);
                try {
                    await api.post(`/admin/orders/${orderId}/confirm-payment`);
                    notify.success(isCash ? 'Order confirmed! Moved to processing.' : 'Payment confirmed successfully');
                    fetchOrders();
                } catch (error) {
                    notify.error('Failed to confirm payment');
                } finally {
                    setProcessing(null);
                }
            }
        });
    };

    // Removed global trackingInputs state as it's now handled locally in OrderCard for performance
    const updateTracking = async (orderId, courier, trackingNumber) => {
        if (!trackingNumber) return notify.error('Please enter a tracking number');

        setProcessing(orderId);
        try {
            await api.patch(`/admin/orders/${orderId}/tracking`, {
                trackingNumber: trackingNumber,
                courierName: courier
            });
            notify.success('Tracking updated & notification sent');
            fetchOrders();
        } catch (error) {
            notify.error('Failed to update tracking');
        } finally {
            setProcessing(null);
        }
    };

    const markCompleted = (orderId) => {
        setModalConfig({
            isOpen: true,
            title: "Mark as Picked Up?",
            message: "This will complete the order. Ensure customer has received their items.",
            type: "info",
            confirmLabel: "Complete Order",
            onConfirm: async () => {
                setProcessing(orderId);
                try {
                    await api.patch(`/admin/orders/${orderId}`, { status: 'COMPLETED' });
                    notify.success('Order marked as completed');
                    fetchOrders();
                } catch (error) {
                    notify.error('Failed to update order');
                } finally {
                    setProcessing(null);
                }
            }
        });
    };

    const deleteOrder = (orderId) => {
        setModalConfig({
            isOpen: true,
            title: "Delete Order?",
            message: "Are you sure you want to permanently delete this order? This action feels... dangerous.",
            type: "danger",
            confirmLabel: "Delete Forever",
            onConfirm: async () => {
                setProcessing(orderId);
                try {
                    await api.delete(`/shop/orders/${orderId}`);
                    notify.success('Order deleted');
                    fetchOrders();
                } catch (error) {
                    notify.error('Failed to delete order');
                } finally {
                    setProcessing(null);
                }
            }
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleString('en-PH', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                hour12: true
            });
        } catch (e) {
            return dateString;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING_PAYMENT':
            case 'PENDING': return 'text-amber-500';
            case 'PROCESSING': return 'text-blue-500';
            case 'SHIPPED':
            case 'COMPLETED': return 'text-emerald-500';
            default: return 'text-neutral-500';
        }
    };

    const groupOrders = () => {
        // Safe guard against non-array orders
        if (!Array.isArray(orders)) return { pending: [], processing: [], shipped: [] };

        // First sort the orders based on sortMode
        const sorted = [...orders].sort((a, b) => {
            if (sortMode === 'NEWEST') return new Date(b.createdAt) - new Date(a.createdAt);
            if (sortMode === 'OLDEST') return new Date(a.createdAt) - new Date(b.createdAt);
            // Other modes can be handled by the columns themselves or refined here
            return 0;
        });

        // Helper for consistent internal sorting within columns if needed
        const sortByMethod = (a, b) => {
            if (a.deliveryMethod === 'DELIVERY' && b.deliveryMethod !== 'DELIVERY') return -1;
            if (a.deliveryMethod !== 'DELIVERY' && b.deliveryMethod === 'DELIVERY') return 1;
            return 0;
        };

        return {
            pending: sorted.filter(o => o.status === 'PENDING_PAYMENT' || o.status === 'PENDING' || o.status === 'NEW').sort(sortByMethod),
            processing: sorted.filter(o => o.status === 'PROCESSING').sort(sortByMethod),
            shipped: sorted.filter(o => o.status === 'SHIPPED' || o.status === 'COMPLETED' || o.status === 'DELIVERED').sort(sortByMethod)
        };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    const groups = groupOrders();

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white mb-2">Order Management</h1>
                    <p className="text-sm md:text-base text-neutral-400">Track orders, confirmations, and shipping</p>
                </div>
                <div className="flex gap-3">
                    <select
                        value={sortMode}
                        onChange={(e) => setSortMode(e.target.value)}
                        className="bg-neutral-900 border border-neutral-800 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-amber-500 cursor-pointer"
                    >
                        <option value="NEWEST">Newest First</option>
                        <option value="OLDEST">Oldest First</option>
                    </select>
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-widest transition-colors ${showArchived ? 'bg-amber-500 text-black' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}
                    >
                        {showArchived ? 'Show Active' : 'Show Archived'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Column 1: Awaiting Payment */}
                <div>
                    <h2 className="text-sm font-black text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <AlertCircle size={16} /> Awaiting Confirmation ({groups.pending.length})
                    </h2>
                    {groups.pending.length === 0 && <p className="text-neutral-600 text-sm italic">No pending orders</p>}
                    {groups.pending.map(order =>
                        <OrderCard
                            key={order.id}
                            order={order}
                            updateTracking={updateTracking}
                            deleteOrder={deleteOrder}
                            confirmPayment={confirmPayment}
                            markCompleted={markCompleted}
                            processing={processing}
                            formatDate={formatDate}
                            getStatusColor={getStatusColor}
                            requestArchive={requestArchive}
                        />
                    )}
                </div>

                {/* Column 2: To Ship / Processing */}
                <div>
                    <h2 className="text-sm font-black text-blue-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Package size={16} /> To Ship / Process ({groups.processing.length})
                    </h2>
                    {groups.processing.length === 0 && <p className="text-neutral-600 text-sm italic">No active orders</p>}
                    {groups.processing.map(order =>
                        <OrderCard
                            key={order.id}
                            order={order}
                            updateTracking={updateTracking}
                            deleteOrder={deleteOrder}
                            confirmPayment={confirmPayment}
                            markCompleted={markCompleted}
                            processing={processing}
                            formatDate={formatDate}
                            getStatusColor={getStatusColor}
                            requestArchive={requestArchive}
                        />
                    )}
                </div>

                {/* Column 3: Completed / Shipped */}
                <div>
                    <h2 className="text-sm font-black text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Truck size={16} /> Shipped / Completed ({groups.shipped.length})
                    </h2>
                    {groups.shipped.length === 0 && <p className="text-neutral-600 text-sm italic">No recent shipments</p>}
                    {groups.shipped.map(order =>
                        <OrderCard
                            key={order.id}
                            order={order}
                            updateTracking={updateTracking}
                            deleteOrder={deleteOrder}
                            confirmPayment={confirmPayment}
                            markCompleted={markCompleted}
                            processing={processing}
                            formatDate={formatDate}
                            getStatusColor={getStatusColor}
                            requestArchive={requestArchive}
                        />
                    )}
                </div>
            </div>

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={modalConfig.onConfirm}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                confirmLabel={modalConfig.confirmLabel}
            />
        </div>
    );
}


