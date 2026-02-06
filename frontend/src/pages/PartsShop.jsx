import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, X, Clock, CreditCard, Wallet, ShieldCheck, Lock, ChevronRight, Package, QrCode, Building, Smartphone } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import api from '../api/client';

const PartsShop = () => {
    const navigate = useNavigate();
    const notify = useNotification();
    const [parts, setParts] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCart, setShowCart] = useState(false);
    const [checkoutMode, setCheckoutMode] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState('GCASH_MANUAL');
    const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
    const checkoutRef = useRef(null);

    useEffect(() => {
        if (checkoutMode && checkoutRef.current) {
            setTimeout(() => {
                checkoutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [checkoutMode]);

    const fetchParts = async () => {
        try {
            const res = await api.get('/shop/public/parts');
            setParts(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParts();
    }, []);

    const addToCart = (part) => {
        let newCart;
        const exists = cart.find(i => i.id === part.id);
        if (exists) {
            newCart = cart.map(i => i.id === part.id ? { ...i, qty: i.qty + 1 } : i);
        } else {
            newCart = [...cart, { ...part, qty: 1 }];
        }
        setCart(newCart);
        localStorage.setItem('cart', JSON.stringify(newCart));
    };

    const total = cart.reduce((sum, i) => sum + (i.sellingPrice * i.qty), 0);

    const handleManualOrder = async () => {
        if (!formData.name || !formData.phone) {
            notify.error("Name and Phone are required.");
            return;
        }
        setLoading(true);
        try {
            await api.post('/shop/public/order', {
                customerName: formData.name,
                phone: formData.phone,
                email: formData.email || 'no-email@example.com',
                items: cart.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.sellingPrice })),
                totalAmount: total,
                paymentMethod: selectedPayment,
                deliveryMethod: 'PICKUP',
                specialInstructions: `Manual Quick Checkout (${selectedPayment})`
            });
            setCart([]);
            localStorage.removeItem('cart');
            setShowCart(false);
            setCheckoutMode(false);
            setFormData({ name: '', phone: '', email: '' });
            notify.success("Order placed! We will contact you for payment.");
        } catch (err) {
            console.error(err);
            notify.error("Failed to place order.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black p-6 lg:p-12 animate-in fade-in duration-700">
            <div className="max-w-7xl mx-auto flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">X-ICON Performance Store</h1>
                    <p className="text-amber-500 font-bold uppercase tracking-[0.3em] text-xs mt-1">Upgrade your machine with elite parts</p>
                </div>
                <button
                    onClick={() => setShowCart(true)}
                    className="relative bg-white text-black p-4 rounded-2xl shadow-2xl hover:scale-110 transition-all active:scale-95"
                >
                    <ShoppingBag size={24} />
                    {cart.length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-amber-500 text-black text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-4 border-neutral-950">
                            {cart.length}
                        </span>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {parts.map(part => (
                    <div key={part.id} className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 p-4 rounded-3xl hover:border-amber-500/30 transition-all duration-300 group h-full flex flex-col">
                        <div className="bg-neutral-950 rounded-2xl mb-3 aspect-square flex items-center justify-center border border-neutral-800 transition-transform group-hover:scale-105 overflow-hidden relative shrink-0">
                            {part.image ? (
                                <img src={part.image} alt={part.name} className="w-full h-full object-cover" />
                            ) : (
                                <ShoppingBag className="text-neutral-700" size={32} />
                            )}
                        </div>
                        <div className="flex-1 min-h-[60px]">
                            <h3 className="text-sm font-black text-white uppercase tracking-tight line-clamp-2 leading-tight" title={part.name}>{part.name}</h3>
                            <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mt-1 mb-3">{part.partNumber}</p>
                        </div>

                        <div className="flex justify-between items-center relative mt-auto pt-3 border-t border-dashed border-neutral-800">
                            <div className="flex flex-col">
                                <span className="text-lg font-black text-emerald-500 italic px-1">₱{(part.sellingPrice || 0).toLocaleString()}</span>
                                {part.quantity === 1 && (
                                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest animate-pulse ml-1">
                                        Only 1 Left!
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => addToCart(part)}
                                disabled={part.quantity <= 0}
                                className={`text-[10px] font-black px-3 py-2 rounded-lg uppercase tracking-widest transition-colors ${part.quantity > 0
                                    ? 'bg-white text-black hover:bg-amber-500'
                                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                                    }`}
                            >
                                {part.quantity > 0 ? 'Add' : 'N/A'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showCart && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-300">
                    <div className="w-full max-w-lg bg-neutral-900/95 border-l border-neutral-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 h-full">
                        {/* Header */}
                        <div className="p-8 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50 backdrop-blur-md">
                            <div>
                                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Your Build</h2>
                                <p className="text-amber-500 text-[10px] font-bold uppercase tracking-widest mt-1">Ready for Checkout</p>
                            </div>
                            <button onClick={() => setShowCart(false)} className="w-10 h-10 rounded-full bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 flex items-center justify-center transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Scrollable Content (Items + Form) */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                            {/* Cart Items List */}
                            <div className="space-y-4">
                                {cart.length === 0 ? (
                                    <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                                        <ShoppingBag size={48} className="text-neutral-600" />
                                        <p className="text-neutral-400 font-bold uppercase tracking-widest text-sm">Your cart is empty</p>
                                    </div>
                                ) : (
                                    cart.map(item => (
                                        <div key={item.id} className="flex justify-between items-center p-4 bg-neutral-950/50 border border-neutral-800 rounded-2xl hover:border-neutral-700 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-neutral-900 rounded-lg flex items-center justify-center overflow-hidden border border-neutral-800">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package size={20} className="text-neutral-700" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-white uppercase tracking-tight group-hover:text-amber-500 transition-colors">{item.name}</p>
                                                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Qty: {item.qty}</p>
                                                </div>
                                            </div>
                                            <span className="text-lg font-black text-emerald-500 italic">₱{(item.sellingPrice * item.qty).toLocaleString()}</span>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Total & Checkout Section */}
                            {cart.length > 0 && (
                                <div className="pt-8 border-t border-neutral-800 space-y-8">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-black text-neutral-500 uppercase tracking-[0.2em]">Total Amount</span>
                                        <span className="text-4xl font-black text-white italic tracking-tight">₱{total.toLocaleString()}</span>
                                    </div>

                                    {checkoutMode ? (
                                        <div ref={checkoutRef} className="space-y-4 animate-in slide-in-from-bottom-5">
                                            <div className="p-4 bg-neutral-800 rounded-xl space-y-3 border border-neutral-700">
                                                <h3 className="text-amber-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                                    <Lock size={12} /> Manual Secure Checkout
                                                </h3>
                                                <input
                                                    type="text"
                                                    placeholder="Full Name *"
                                                    className="w-full bg-neutral-900 border border-neutral-700 p-3 rounded-lg text-sm text-white focus:border-amber-500 outline-none"
                                                    value={formData.name}
                                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                />
                                                <input
                                                    type="tel"
                                                    placeholder="Phone Number *"
                                                    className="w-full bg-neutral-900 border border-neutral-700 p-3 rounded-lg text-sm text-white focus:border-amber-500 outline-none"
                                                    value={formData.phone}
                                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                />
                                                <input
                                                    type="email"
                                                    placeholder="Email (Optional)"
                                                    className="w-full bg-neutral-900 border border-neutral-700 p-3 rounded-lg text-sm text-white focus:border-amber-500 outline-none"
                                                    value={formData.email}
                                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                />
                                                <p className="text-[10px] text-neutral-500 leading-tight">
                                                    By placing this order, you agree to pay via your selected method upon confirmation.
                                                </p>

                                                <div className="pt-2 border-t border-neutral-700">
                                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Select Payment Method</p>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <button
                                                            onClick={() => setSelectedPayment('GCASH_MANUAL')}
                                                            className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${selectedPayment === 'GCASH_MANUAL' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-600'}`}
                                                        >
                                                            <Smartphone size={16} />
                                                            <span className="text-[9px] font-bold">GCash</span>
                                                        </button>
                                                        <button
                                                            onClick={() => setSelectedPayment('PAYMAYA')}
                                                            className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${selectedPayment === 'PAYMAYA' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-600'}`}
                                                        >
                                                            <QrCode size={16} />
                                                            <span className="text-[9px] font-bold">PayMaya</span>
                                                        </button>
                                                        <button
                                                            onClick={() => setSelectedPayment('BANK_TRANSFER')}
                                                            className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${selectedPayment === 'BANK_TRANSFER' ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-600'}`}
                                                        >
                                                            <Building size={16} />
                                                            <span className="text-[9px] font-bold">Bank</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {(selectedPayment === 'GCASH_MANUAL' || selectedPayment === 'PAYMAYA') && (
                                                    <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center space-y-2 animate-in zoom-in-95 duration-300">
                                                        <div className="w-32 h-32 bg-neutral-900 flex items-center justify-center rounded-lg relative overflow-hidden">
                                                            <QrCode size={64} className="text-white opacity-50" />
                                                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/10" />
                                                        </div>
                                                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest text-center">
                                                            Scan to Pay via {selectedPayment === 'GCASH_MANUAL' ? 'GCash' : 'PayMaya'}
                                                        </p>
                                                        <p className="text-xs font-black text-neutral-800 tracking-tight">
                                                            {selectedPayment === 'GCASH_MANUAL' ? 'Juan Dela Cruz • 0917 123 4567' : 'Juan D. • 0918 123 4567'}
                                                        </p>
                                                    </div>
                                                )}

                                                {selectedPayment === 'BANK_TRANSFER' && (
                                                    <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 space-y-2 animate-in slide-in-from-top-2">
                                                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Bank Details</p>
                                                        <div className="space-y-1">
                                                            <p className="text-xs text-white font-mono">BDO Unibank</p>
                                                            <p className="text-xs text-white font-mono">Account: 0012 3456 7890</p>
                                                            <p className="text-xs text-white font-mono">Name: X-ICON GARAGE</p>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setCheckoutMode(false)}
                                                        className="flex-1 bg-neutral-800 text-white font-bold py-3 rounded-xl hover:bg-neutral-700 transition-all text-xs uppercase tracking-widest"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleManualOrder}
                                                        disabled={loading}
                                                        className="flex-[2] bg-amber-500 hover:bg-amber-400 text-black font-black py-3 rounded-xl uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
                                                    >
                                                        {loading ? 'Sending...' : 'Place Order'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setCheckoutMode(true)}
                                            className="w-full bg-white hover:bg-neutral-200 text-black font-black py-4 rounded-xl uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl"
                                        >
                                            Checkout Now <ChevronRight size={16} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartsShop;




