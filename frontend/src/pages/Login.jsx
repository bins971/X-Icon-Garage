import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import logo from '../assets/logo_clean.png';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const notify = useNotification();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [twoFactorStep, setTwoFactorStep] = useState(false);
    const [tempToken, setTempToken] = useState('');
    const [otpToken, setOtpToken] = useState('');
    const { login, verify2FA } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (twoFactorStep) {
                await verify2FA(tempToken, otpToken);
                notify.success('Security check passed!');
                navigate('/dashboard');
            } else {
                const data = await login(username, password);
                if (data.require2FA) {
                    setTwoFactorStep(true);
                    setTempToken(data.tempToken);
                    notify.info('Two-factor authentication required');
                } else {
                    notify.success('Authentication successful. Welcome back!');
                    navigate('/dashboard');
                }
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Authentication failed.';
            setError(msg);
            notify.error(msg);
            if (twoFactorStep) {
                setOtpToken('');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
            <div className="max-w-md w-full bg-neutral-900 p-8 rounded-2xl shadow-2xl border border-neutral-800 relative overflow-hidden">
                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-600 left-0"></div>
                <div className="flex flex-col items-center mb-8">
                    <div className="mb-6">
                        <img src={logo} alt="X-Icon Garage Logo" className="h-24 w-auto object-contain" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 bg-clip-text text-transparent">X-ICON GARAGE</h1>
                    <p className="text-neutral-500 mt-2 text-center text-sm uppercase tracking-widest font-semibold">
                        {twoFactorStep ? 'Security Verification' : 'Staff Access Portal'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg mb-6 text-sm text-center animate-in shake duration-300">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {!twoFactorStep ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-2">Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all placeholder-neutral-600"
                                    placeholder="Username"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-2">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all placeholder-neutral-600"
                                    placeholder="Password"
                                    required
                                />
                            </div>
                        </>
                    ) : (
                        <div className="animate-in zoom-in-95 duration-300">
                            <label className="block text-sm font-medium text-neutral-400 mb-4 text-center uppercase tracking-widest">Enter 6-Digit Secondary Code</label>
                            <input
                                type="text"
                                autoFocus
                                value={otpToken}
                                onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                                className="w-full bg-neutral-950 border border-amber-500/50 rounded-xl py-6 text-white text-center text-4xl font-black tracking-[0.5em] focus:outline-none focus:ring-4 focus:ring-amber-500/10 transition-all shadow-inner"
                                placeholder={"000000"}
                                maxLength={6}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setTwoFactorStep(false)}
                                className="w-full text-neutral-600 hover:text-neutral-400 text-[10px] font-black uppercase tracking-widest mt-6 transition-colors"
                            >
                                Back to Password Login
                            </button>
                        </div>
                    )}
                    <button
                        type="submit"
                        className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 group active:scale-95"
                    >
                        <span>{twoFactorStep ? 'Verify Identity' : 'Secure Login'}</span>
                        <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
