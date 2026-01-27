import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useNotification } from '../context/NotificationContext';
import { Wrench, Mail, Lock, ArrowRight, User, Shield, CheckCircle } from 'lucide-react';

const CustomerSignup = () => {
    const notify = useNotification();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        name: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match');
        }

        setLoading(true);
        try {
            const { data } = await api.post('/auth/register', {
                username: formData.username,
                password: formData.password,
                name: formData.name
            });
            localStorage.setItem('token', data.token);
            notify.success('Access established! Welcome to the elite portal.');
            window.location.href = '/my-garage'; // Force reload to pick up new user
        } catch (err) {
            const msg = err.response?.data?.message || 'Registration failed. Try a different username.';
            setError(msg);
            notify.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 selection:bg-amber-500/30">
            <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-amber-600/5 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-10">
                    <Link to="/" className="inline-flex items-center gap-3 mb-8 group">
                        <div className="bg-amber-500 p-2 rounded-xl shadow-xl shadow-amber-500/20 group-hover:scale-110 transition-all">
                            <Wrench size={24} className="text-black" />
                        </div>
                        <span className="text-2xl font-black text-white tracking-tighter uppercase italic">X-ICON <span className="text-amber-500">GARAGE</span></span>
                    </Link>
                    <h1 className="text-3xl font-black text-white tracking-tight leading-none uppercase italic">JOIN THE <span className="text-amber-500">ELITE</span></h1>
                    <p className="text-neutral-500 mt-4 font-bold uppercase tracking-widest text-xs">Create your secure portal account</p>
                </div>

                <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 p-8 rounded-[2.5rem] shadow-2xl overflow-hidden group">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-black rounded-2xl text-center uppercase tracking-widest">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-neutral-500 uppercase tracking-widest ml-1">Full Identity</label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-600">
                                    <User size={18} />
                                </span>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-neutral-950 border border-neutral-800 text-white px-14 py-4 rounded-2xl focus:outline-none focus:border-amber-500/50 transition-all font-bold text-sm placeholder:text-neutral-700"
                                    placeholder="Enter your full name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-neutral-500 uppercase tracking-widest ml-1">Username / Email</label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-600">
                                    <Mail size={18} />
                                </span>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-neutral-950 border border-neutral-800 text-white px-14 py-4 rounded-2xl focus:outline-none focus:border-amber-500/50 transition-all font-bold text-sm placeholder:text-neutral-700"
                                    placeholder="Choose a username"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-neutral-500 uppercase tracking-widest ml-1">Secure Password</label>
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-600">
                                        <Lock size={18} />
                                    </span>
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-neutral-950 border border-neutral-800 text-white px-14 py-4 rounded-2xl focus:outline-none focus:border-amber-500/50 transition-all font-bold text-sm placeholder:text-neutral-700"
                                        placeholder="Pick a pass"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-neutral-500 uppercase tracking-widest ml-1">Confirm Identity</label>
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-600">
                                        <CheckCircle size={18} />
                                    </span>
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-neutral-950 border border-neutral-800 text-white px-14 py-4 rounded-2xl focus:outline-none focus:border-amber-500/50 transition-all font-bold text-sm placeholder:text-neutral-700"
                                        placeholder="Repeat password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white hover:bg-neutral-200 disabled:opacity-50 text-black py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] mt-4"
                        >
                            {loading ? 'CREATING...' : 'ESTABLISH ACCESS'}
                            <ArrowRight size={18} />
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-neutral-800 text-center">
                        <p className="text-neutral-500 text-xs font-black uppercase tracking-widest mb-4">Already a member?</p>
                        <Link to="/customer-login" className="text-amber-500 hover:text-amber-400 transition-colors font-black text-sm uppercase tracking-tight">
                            LOG IN TO GARAGE
                        </Link>
                    </div>
                </div>

                <div className="mt-8 flex items-center justify-center gap-4 text-neutral-600">
                    <Shield size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Enterprise-Grade Security Protocol</span>
                </div>
            </div>
        </div>
    );
};

export default CustomerSignup;
