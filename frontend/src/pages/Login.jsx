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
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(username, password);
            notify.success('Authentication successful. Welcome back!');
            navigate('/dashboard');
        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed. Please check server connection.';
            setError(msg);
            notify.error(msg);
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
                    <p className="text-neutral-500 mt-2 text-center text-sm uppercase tracking-widest font-semibold">Staff Access Portal</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
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
                    <button
                        type="submit"
                        className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 group"
                    >
                        <span>Login to Portal</span>
                        <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
