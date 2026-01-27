import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { ShieldCheck, Lock, Smartphone, Save, Loader2, ArrowLeft, Trash2, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

const SecuritySettings = () => {
    const { user } = useAuth();
    const notify = useNotification();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [setup2FA, setSetup2FA] = useState(null); // { secret, qrCode }
    const [token, setToken] = useState('');

    const [pinData, setPinData] = useState({
        currentPin: '',
        newPin: '',
        confirmPin: '',
        password: ''
    });

    const handleUpdatePin = async (e) => {
        e.preventDefault();
        if (pinData.newPin !== pinData.confirmPin) {
            return notify.error('New PINs do not match');
        }
        if (pinData.newPin.length !== 6) {
            return notify.error('PIN must be 6 digits');
        }

        setLoading(true);
        try {
            await api.put('/auth/security/pin', {
                currentPin: pinData.currentPin,
                newPin: pinData.newPin,
                password: pinData.password
            });
            notify.success('Security PIN updated successfully');
            setPinData({ currentPin: '', newPin: '', confirmPin: '', password: '' });
        } catch (error) {
            notify.error(error.response?.data?.message || 'Failed to update PIN');
        } finally {
            setLoading(false);
        }
    };

    const handleSetup2FA = async () => {
        setLoading(true);
        try {
            const res = await api.post('/auth/2fa/setup');
            setSetup2FA(res.data);
        } catch (error) {
            notify.error('Failed to initialize 2FA setup');
        } finally {
            setLoading(false);
        }
    };

    const handleEnable2FA = async () => {
        if (!token) return notify.error('Please enter the token from your app');
        setLoading(true);
        try {
            await api.post('/auth/2fa/enable', {
                secret: setup2FA.secret,
                token
            });
            notify.success('2FA enabled successfully!');
            setSetup2FA(null);
            setToken('');
            window.location.reload(); // Refresh to update user context/state
        } catch (error) {
            notify.error(error.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDisable2FA = async () => {
        const inputToken = prompt('Enter 2FA token to confirm disabling:');
        if (!inputToken) return;

        setLoading(true);
        try {
            await api.post('/auth/2fa/disable', { token: inputToken });
            notify.success('2FA disabled');
            window.location.reload();
        } catch (error) {
            notify.error(error.response?.data?.message || 'Failed to disable 2FA');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase">Security Settings</h1>
                    <p className="text-neutral-500 mt-1 font-medium tracking-wide">MANAGE ACCESS & AUTHENTICATION PROTOCOLS</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* PIN Management */}
                <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800 p-8 rounded-[2.5rem] shadow-2xl">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-500">
                            <Lock size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none">Security PIN</h3>
                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Transaction Verification</p>
                        </div>
                    </div>

                    <form onSubmit={handleUpdatePin} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Account Password (Required for ID check)</label>
                            <input
                                type="password"
                                required
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-white font-bold focus:border-amber-500/50 outline-none transition-all"
                                placeholder={"Current Password"}
                                value={pinData.password}
                                onChange={e => setPinData({ ...pinData, password: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">New 6-Digit PIN</label>
                                <input
                                    type="password"
                                    maxLength={6}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-white font-bold focus:border-amber-500/50 outline-none transition-all text-center tracking-widest"
                                    placeholder="••••••"
                                    value={pinData.newPin}
                                    onChange={e => setPinData({ ...pinData, newPin: e.target.value.replace(/\D/g, '') })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Confirm New PIN</label>
                                <input
                                    type="password"
                                    maxLength={6}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-white font-bold focus:border-amber-500/50 outline-none transition-all text-center tracking-widest"
                                    placeholder="••••••"
                                    value={pinData.confirmPin}
                                    onChange={e => setPinData({ ...pinData, confirmPin: e.target.value.replace(/\D/g, '') })}
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full bg-neutral-800 hover:bg-neutral-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-4"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} className="text-amber-500" /> UPDATE SECURITY PIN</>}
                        </button>
                    </form>
                </div>

                {/* 2FA Management */}
                <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800 p-8 rounded-[2.5rem] shadow-2xl">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-500">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none">Two-Factor Auth</h3>
                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Multi-Layer Protection</p>
                        </div>
                        <div className={`ml-auto px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${user?.twoFactorEnabled ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                            {user?.twoFactorEnabled ? 'ENFORCED' : 'DISABLED'}
                        </div>
                    </div>

                    {!user?.twoFactorEnabled && !setup2FA && (
                        <div className="text-center py-10">
                            <Smartphone size={64} className="mx-auto text-neutral-800 mb-6" />
                            <p className="text-neutral-400 text-sm font-medium mb-8 max-w-xs mx-auto">Enhance your account security by requiring a code from your mobile device when logging in.</p>
                            <button
                                onClick={handleSetup2FA}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center gap-2 mx-auto"
                            >
                                <Key size={18} /> INITIALIZE 2FA SETUP
                            </button>
                        </div>
                    )}

                    {setup2FA && (
                        <div className="space-y-6 animate-in zoom-in-95">
                            <div className="bg-neutral-950 p-6 rounded-[2rem] border border-neutral-800 flex flex-col items-center">
                                <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest mb-4">Scan with Google Authenticator or Authy</p>
                                <div className="bg-white p-4 rounded-2xl mb-4">
                                    <img src={setup2FA.qrCode} alt="2FA QR Code" className="w-40 h-40" />
                                </div>
                                <code className="text-amber-500 text-xs font-black tracking-widest bg-neutral-900 px-4 py-2 rounded-xl mb-6 select-all uppercase">
                                    {setup2FA.secret}
                                </code>
                                <div className="w-full space-y-4">
                                    <input
                                        type="text"
                                        maxLength={6}
                                        placeholder="ENTER 6-DIGIT TOKEN"
                                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white text-center text-xl font-black tracking-[0.3em] focus:border-blue-500 outline-none transition-all"
                                        value={token}
                                        onChange={e => setToken(e.target.value.replace(/\D/g, ''))}
                                    />
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setSetup2FA(null)}
                                            className="flex-1 bg-neutral-800 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest"
                                        >
                                            CANCEL
                                        </button>
                                        <button
                                            onClick={handleEnable2FA}
                                            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/20"
                                        >
                                            VERIFY & ENABLE
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {user?.twoFactorEnabled && (
                        <div className="p-8 border-2 border-dashed border-emerald-500/20 rounded-[2rem] text-center">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                                <ShieldCheck size={32} className="text-emerald-500" />
                            </div>
                            <h4 className="text-white font-black uppercase text-xs tracking-widest mb-2">Maximum Protection Active</h4>
                            <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-10">Your account is secured with two-factor authentication.</p>

                            <button
                                onClick={handleDisable2FA}
                                className="text-red-500/60 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.2em] transition-colors flex items-center gap-2 mx-auto"
                            >
                                <Trash2 size={14} /> DEACTIVATE PROTECTION
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SecuritySettings;
