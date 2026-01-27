import React, { useState } from 'react';
import { ShoppingBag, X, Clock, CreditCard, Wallet, ShieldCheck, Lock, ChevronRight, Package } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import api from '../api/client';

const PartsShop = () => {
    const [parts, setParts] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCart, setShowCart] = useState(false);

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

    useState(() => { fetchParts(); }, []);

    const addToCart = (part) => {
        const exists = cart.find(i => i.id === part.id);
        if (exists) {
            setCart(cart.map(i => i.id === part.id ? { ...i, qty: i.qty + 1 } : i));
        } else {
            setCart([...cart, { ...part, qty: 1 }]);
        }
    };

    const total = cart.reduce((sum, i) => sum + (i.sellingPrice * i.qty), 0);

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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {parts.map(part => (
                    <div key={part.id} className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 p-8 rounded-[2.5rem] hover:border-amber-500/30 transition-all duration-300 group">
                        <div className="bg-neutral-950 rounded-3xl mb-6 aspect-square flex items-center justify-center border border-neutral-800 transition-transform group-hover:scale-105 overflow-hidden relative">
                            {part.image ? (
                                <img src={part.image} alt={part.name} className="w-full h-full object-cover" />
                            ) : (
                                <ShoppingBag className="text-neutral-700" size={48} />
                            )}
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">{part.name}</h3>
                        <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-1 mb-6">{part.partNumber}</p>

                        <div className="flex justify-between items-center">
                            <span className="text-2xl font-black text-emerald-500 italic px-1">₱{part.sellingPrice.toLocaleString()}</span>
                            <button
                                onClick={() => addToCart(part)}
                                disabled={part.quantity <= 0}
                                className={`text-[10px] font-black px-6 py-3 rounded-xl uppercase tracking-widest transition-colors ${part.quantity > 0
                                    ? 'bg-white text-black hover:bg-amber-500'
                                    : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                                    }`}
                            >
                                {part.quantity > 0 ? 'Add to Build' : 'Out of Stock'}
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

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-4 scrollbar-hide">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
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

                        {/* Footer / Checkout */}
                        <div className="p-8 bg-neutral-900 border-t border-neutral-800 space-y-6">
                            <div className="flex justify-between items-end">
                                <span className="text-xs font-black text-neutral-500 uppercase tracking-[0.2em]">Total Amount</span>
                                <span className="text-4xl font-black text-white italic tracking-tight">₱{total.toLocaleString()}</span>
                            </div>

                            {cart.length > 0 && (
                                <CheckoutForm
                                    cart={cart}
                                    total={total}
                                    onClear={() => setCart([])}
                                    onCancel={() => setShowCart(false)}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const CheckoutForm = ({ cart, total, onClear, onCancel }) => {
    const notify = useNotification();
    const [formData, setFormData] = useState({
        customerName: '',
        email: '',
        phone: '',
        paymentMethod: 'CASH',
        cardNumber: '', expiry: '', cvv: '', gcashNumber: ''
    });
    const [status, setStatus] = useState('IDLE');

    const handleCheckout = async (e) => {
        e.preventDefault();

        // 1. Explicit Validation
        if (!formData.customerName || !formData.email || !formData.phone) {
            notify.error('Please complete your contact details.');
            return;
        }

        if (formData.paymentMethod === 'GCASH' && !formData.gcashNumber) {
            notify.error('Please enter your GCash number.');
            return;
        }

        // Note: We removed CC inputs, so no need to validate them for the "Simulation".

        setStatus('LOADING');

        // 2. Simulate Delay
        if (formData.paymentMethod !== 'CASH') {
            await new Promise(resolve => setTimeout(resolve, 2500));
        }

        try {
            await api.post('/shop/public/order', {
                ...formData,
                items: cart.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.sellingPrice })),
                totalAmount: total,
                paymentMethod: formData.paymentMethod,
                cardNumber: formData.paymentMethod === 'CARD' ? formData.cardNumber : undefined,
                gcashNumber: formData.paymentMethod === 'GCASH' ? formData.gcashNumber : undefined
            });

            notify.success(`Success! Order #${Math.floor(Math.random() * 9000) + 1000} Confirmed.`);
            onClear();
            onCancel();
        } catch (error) {
            notify.error('Transaction failed. Server not responding.');
            setStatus('IDLE');
        }
    };

    if (status === 'LOADING') {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-8 animate-in fade-in">
                <div className="relative">
                    <div className="w-24 h-24 border-[6px] border-neutral-800 border-t-emerald-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Lock size={32} className="text-emerald-500 animate-pulse" />
                    </div>
                </div>
                <div className="text-center space-y-3">
                    <h3 className="text-white font-black text-xl uppercase tracking-widest">
                        {formData.paymentMethod === 'CARD' ? 'Processing...' : 'Verifying...'}
                    </h3>
                    <p className="text-neutral-500 text-xs font-medium tracking-wide">Secure transaction in progress</p>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleCheckout} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Contact Info */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Contact Details</label>
                </div>
                <div className="space-y-3">
                    <input type="text" placeholder="Full Name" className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl px-5 py-4 text-white text-sm focus:border-amber-500 focus:bg-neutral-950 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all placeholder:text-neutral-700 font-medium"
                        value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} />
                    <input type="email" placeholder="Email Address" className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl px-5 py-4 text-white text-sm focus:border-amber-500 focus:bg-neutral-950 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all placeholder:text-neutral-700 font-medium"
                        value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    <input type="tel" placeholder="Phone Number" className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl px-5 py-4 text-white text-sm focus:border-amber-500 focus:bg-neutral-950 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all placeholder:text-neutral-700 font-medium"
                        value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Payment Method</label>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { id: 'CASH', icon: <Wallet size={18} />, label: 'Cash' },
                        { id: 'CARD', icon: <CreditCard size={18} />, label: 'Card' },
                        { id: 'GCASH', icon: <span className="font-black text-xs">GC</span>, label: 'GCash' }
                    ].map(method => (
                        <button
                            key={method.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, paymentMethod: method.id })}
                            className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl transition-all duration-300 border-2 relative overflow-hidden group ${formData.paymentMethod === method.id
                                ? 'bg-white text-black border-white shadow-lg scale-[1.02]'
                                : 'bg-neutral-950/50 text-neutral-500 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
                                }`}
                        >
                            <div className={`transition-transform duration-300 ${formData.paymentMethod === method.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                                {method.icon}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">{method.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Dynamic Payment Content */}
            <div className="min-h-[80px] transition-all duration-300">
                {formData.paymentMethod === 'CARD' && (
                    <div className="bg-neutral-950/50 border border-neutral-800 rounded-2xl p-5 animate-in fade-in zoom-in-95 space-y-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <CreditCard size={64} className="text-white" />
                        </div>
                        <div className="space-y-3 relative z-10">
                            <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-1">Card Details</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                                    <CreditCard size={16} />
                                </span>
                                <input
                                    type="text"
                                    placeholder="0000 0000 0000 0000"
                                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-12 pr-4 py-3 text-white text-sm focus:border-amber-500 outline-none transition-all placeholder:text-neutral-700 font-mono tracking-wider"
                                    value={formData.cardNumber || ''}
                                    onChange={e => setFormData({ ...formData, cardNumber: e.target.value.replace(/\D/g, '').slice(0, 16) })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder="MM/YY"
                                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 outline-none transition-all placeholder:text-neutral-700 font-mono text-center"
                                    value={formData.expiry || ''}
                                    onChange={e => setFormData({ ...formData, expiry: e.target.value })}
                                />
                                <input
                                    type="password"
                                    placeholder="CVV"
                                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 outline-none transition-all placeholder:text-neutral-700 font-mono text-center"
                                    value={formData.cvv || ''}
                                    onChange={e => setFormData({ ...formData, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                                />
                            </div>
                        </div>
                        <div className="pt-3 border-t border-neutral-800 flex items-center justify-center gap-2">
                            <ShieldCheck size={14} className="text-emerald-500" />
                            <span className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em]">Encrypted Transaction</span>
                        </div>
                    </div>
                )}

                {formData.paymentMethod === 'GCASH' && (
                    <div className="bg-[#007DF2]/10 border border-[#007DF2]/30 rounded-2xl p-5 animate-in fade-in zoom-in-95 space-y-3 relative overflow-hidden">
                        <div className="absolute top-[-10px] right-[-10px] w-20 h-20 bg-[#007DF2]/20 rounded-full blur-xl"></div>
                        <p className="text-[10px] font-black text-[#007DF2] uppercase tracking-widest mb-1 relative z-10">GCash Mobile Number</p>
                        <div className="relative z-10">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#007DF2] text-sm font-bold">+63</span>
                            <input type="tel" placeholder="912 345 6789" maxLength="10" className="w-full bg-black/50 border border-[#007DF2]/30 rounded-xl pl-12 pr-4 py-3 text-white text-lg font-bold focus:border-[#007DF2] outline-none transition-all placeholder:text-neutral-600 font-mono tracking-wide"
                                value={formData.gcashNumber || ''} onChange={e => setFormData({ ...formData, gcashNumber: e.target.value })} />
                        </div>
                    </div>
                )}
                {formData.paymentMethod === 'CASH' && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center animate-in fade-in zoom-in-95 flex items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                            <Wallet size={20} />
                        </div>
                        <div className="text-left">
                            <p className="text-emerald-500 text-xs font-black uppercase tracking-wider">Pay at Counter</p>
                            <p className="text-emerald-500/60 text-[10px] font-bold">Upon order pickup</p>
                        </div>
                    </div>
                )}
            </div>

            <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black py-4 rounded-2xl transition-all shadow-xl shadow-amber-500/10 hover:shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 blur-md"></div>
                <span className="relative z-10">{formData.paymentMethod === 'CARD' ? 'Secure Checkout' : 'Place Order'}</span>
                <ChevronRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            </button>
        </form>
    );
};

export default PartsShop;
