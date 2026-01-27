import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { User, Mail, Phone, Camera, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

const CustomerProfile = () => {
    const { user, login } = useAuth();
    const notify = useNotification();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
            });
            if (user.profileImage) {
                setPreview(`http://localhost:5000${user.profileImage}`);
            }
        }
    }, [user]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                return notify.error('Image size must be less than 2MB');
            }
            setPreview(URL.createObjectURL(file));
            setFormData({ ...formData, profileImage: file });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.phone.length !== 11 || !formData.phone.startsWith('09')) {
            return notify.error('Phone number must be 11 digits and start with 09');
        }

        setLoading(true);
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('email', formData.email);
            data.append('phone', formData.phone);
            if (formData.profileImage) {
                data.append('profileImage', formData.profileImage);
            }

            const res = await api.put('/auth/profile', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Update local user state if necessary, or just refetch /me
            notify.success('Profile updated successfully!');
            // We might need to refresh the page or update context
            window.location.reload();
        } catch (error) {
            notify.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-200 py-20">
            <div className="container mx-auto px-4 max-w-2xl">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors mb-8 group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    BACK TO GARAGE
                </button>

                <div className="bg-neutral-900 border border-neutral-800 rounded-[3rem] p-10 shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full"></div>

                    <div className="relative z-10 flex flex-col items-center mb-12">
                        <div className="relative group cursor-pointer">
                            <div className="w-32 h-32 rounded-[2.5rem] bg-neutral-950 border-2 border-neutral-800 overflow-hidden flex items-center justify-center relative">
                                {preview ? (
                                    <img src={preview} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={48} className="text-neutral-700" />
                                )}
                                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                    <Camera className="text-white" size={24} />
                                    <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                                </label>
                            </div>
                        </div>
                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mt-6">Edit Profile</h2>
                        <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest mt-1">Personal Access Identity</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-neutral-500 uppercase tracking-widest ml-1">Display Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-4 text-neutral-600" size={20} />
                                <input
                                    required
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 pl-12 text-white font-bold focus:border-amber-500/50 outline-none transition-all"
                                    placeholder="Your full name"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-neutral-500 uppercase tracking-widest ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-4 text-neutral-600" size={20} />
                                <input
                                    required
                                    type="email"
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 pl-12 text-white font-bold focus:border-amber-500/50 outline-none transition-all"
                                    placeholder="email@example.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-neutral-500 uppercase tracking-widest ml-1">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-4 text-neutral-600" size={20} />
                                <input
                                    required
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 pl-12 text-white font-bold focus:border-amber-500/50 outline-none transition-all"
                                    placeholder="09xx xxxx xxx"
                                    value={formData.phone}
                                    onChange={e => {
                                        const re = /^[0-9\b]+$/;
                                        if (e.target.value === '' || re.test(e.target.value)) {
                                            setFormData({ ...formData, phone: e.target.value })
                                        }
                                    }}
                                    maxLength={11}
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full bg-amber-500 hover:bg-amber-400 text-black py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-10"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> UPDATING ACCESS DETAILS</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CustomerProfile;
