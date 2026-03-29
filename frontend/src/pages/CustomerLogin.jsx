import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wrench, Mail, Lock, ArrowRight, UserPlus, Shield } from 'lucide-react';

const CustomerLogin = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await login(credentials.username, credentials.password);
            if (user.role === 'CUSTOMER') {
                navigate('/my-garage');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError('Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 selection:bg-amber-500/30">
            <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-amber-600/5 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-amber-900/5 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-10">
                    <Link to="/" className="inline-flex items-center gap-3 mb-8 group">
                        <div className="bg-amber-500 p-2 rounded-xl shadow-xl shadow-amber-500/20 group-hover:scale-110 transition-all">
                            <Wrench size={24} className="text-black" />
                        </div>
                        <span className="text-2xl font-black text-white tracking-tighter uppercase italic">X-ICON <span className="text-amber-500">GARAGE</span></span>
                    </Link>
                    <h1 className="text-3xl font-black text-white tracking-tight leading-none uppercase italic">ACCESS YOUR GARAGE</h1>
                    <p className="text-neutral-500 mt-4 font-bold uppercase tracking-widest text-xs">Log in to manage your supreme machines</p>
                </div>

                <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-black rounded-2xl text-center uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-neutral-500 uppercase tracking-widest ml-1">Username / Email</label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-amber-500 transition-colors">
                                    <Mail size={18} />
                                </span>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-neutral-950 border border-neutral-800 text-white px-14 py-4 rounded-2xl focus:outline-none focus:border-amber-500/50 transition-all font-bold text-sm placeholder:text-neutral-700"
                                    placeholder="Enter your username"
                                    value={credentials.username}
                                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                                />
                            </div>
                        </div>

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
                                    placeholder="Minimum 8 characters"
                                    value={credentials.password}
                                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-amber-500/10 flex items-center justify-center gap-3 active:scale-[0.98]"
                        >
                            {loading ? 'AUTHENTICATING...' : 'SIGN IN TO GARAGE'}
                            <ArrowRight size={18} />
                        </button>
                    </form>

                    <div className="mt-10 pt-10 border-t border-neutral-800 text-center">
                        <p className="text-neutral-500 text-xs font-black uppercase tracking-widest mb-4">New to our platform?</p>
                        <Link to="/register" className="inline-flex items-center gap-2 text-amber-500 hover:text-amber-400 transition-colors font-black text-sm uppercase tracking-tight">
                            <UserPlus size={18} /> CREATE ACCOUNT
                        </Link>
                    </div>
                </div>

                <div className="mt-12 flex items-center justify-center gap-8 opacity-40">
                    <div className="flex items-center gap-2 grayscale group hover:grayscale-0 transition-all">
                        <Shield size={16} className="text-white" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">End-to-end Encrypted</span>
                    </div>
                    <div className="flex items-center gap-2 grayscale group hover:grayscale-0 transition-all">
                        <Shield size={16} className="text-white" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Secure Data Portal</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerLogin;
