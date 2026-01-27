import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Navigate, Link } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import api from '../api/client';
import {
    Car,
    History,
    Calendar,
    ChevronRight,
    Wrench,
    Clock,
    Settings,
    User,
    ArrowRight,
    X,
    Plus,
    Loader2,
    ChevronDown,
    Package,
    FileText,
    Trash2
} from 'lucide-react';

const MyGarage = () => {
    const notify = useNotification();
    const { user, loading: authLoading } = useAuth();
    const [vehicles, setVehicles] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [manageModal, setManageModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [newVehicle, setNewVehicle] = useState({
        make: '', model: '', year: '', plateNumber: '', vin: '', color: ''
    });
    const [editVehicle, setEditVehicle] = useState(null);

    const fetchGarageData = async () => {
        if (!user || user.role !== 'CUSTOMER') return;
        try {
            const [vRes, jRes, iRes] = await Promise.all([
                api.get('/vehicles'),
                api.get('/job-orders'),
                api.get('/invoices')
            ]);
            setVehicles(vRes.data);
            setJobs(jRes.data);
            setInvoices(iRes.data);
        } catch (error) {
            console.error('Error fetching garage data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGarageData();
    }, [user]);

    const handleAddVehicle = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/vehicles', newVehicle);
            setShowModal(false);
            setNewVehicle({ make: '', model: '', year: '', plateNumber: '', vin: '', color: '' });
            fetchGarageData();
        } catch (error) {
            notify.error(error.response?.data?.message || 'Error adding vehicle');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateVehicle = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.put(`/vehicles/${editVehicle.id}`, editVehicle);
            setManageModal(false);
            setEditVehicle(null);
            notify.success('Machine details updated successfully');
            fetchGarageData();
        } catch (error) {
            notify.error(error.response?.data?.message || 'Error updating vehicle');
        } finally {
            setSubmitting(false);
        }
    };

    const [deleteId, setDeleteId] = useState(null);

    const handleDeleteVehicle = (id) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setSubmitting(true);
        try {
            await api.delete(`/vehicles/${deleteId}`);
            setManageModal(false);
            setEditVehicle(null);
            notify.success('Machine removed from your garage');
            fetchGarageData();
        } catch (error) {
            notify.error(error.response?.data?.message || 'Error removing vehicle');
        } finally {
            setSubmitting(false);
            setDeleteId(null);
        }
    };

    if (authLoading) return <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center font-black uppercase tracking-widest">Initialising Portal...</div>;
    if (!user || user.role !== 'CUSTOMER') return <Navigate to="/customer-login" />;

    const userName = (user?.name || 'Customer').split(' ')[0];

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-200 selection:bg-amber-500/30">
            <main className="container mx-auto px-4 py-16">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
                    <div>
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter italic uppercase leading-none">
                            WELCOME BACK, <br />
                            <span className="text-amber-500 underline decoration-amber-500/20 underline-offset-8">{userName}</span>
                        </h1>
                        <p className="text-neutral-500 font-bold uppercase tracking-widest mt-6 text-xs">Customer Portal | X-ICON ELITE ACCESS</p>
                    </div>
                    <Link to="/profile" className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 p-6 rounded-[2rem] flex items-center gap-4 hover:border-amber-500/30 transition-all group">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-black overflow-hidden">
                            {user?.profileImage ? (
                                <img src={`http://localhost:5000${user.profileImage}`} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User size={24} />
                            )}
                        </div>
                        <div>
                            <p className="text-xs font-black text-neutral-500 uppercase tracking-widest leading-none">Account Status</p>
                            <p className="text-sm font-black text-white mt-1 uppercase group-hover:text-amber-500 transition-colors">Edit Profile</p>
                        </div>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Vehicles Section */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-black text-white tracking-widest uppercase flex items-center gap-3">
                                <Car className="text-amber-500" size={24} />
                                My Machines
                            </h2>
                            <button
                                onClick={() => setShowModal(true)}
                                className="text-xs font-black text-amber-500 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2 group/btn"
                            >
                                <Plus size={14} className="group-hover:rotate-90 transition-transform" />
                                Register New Machine
                            </button>
                        </div>

                        {/* Modal Overlay */}
                        {showModal && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
                                <div className="bg-neutral-900 border border-neutral-800 w-full max-w-xl rounded-[3rem] p-10 relative z-10 shadow-2xl animate-in zoom-in-95 duration-300">
                                    <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-neutral-500 hover:text-white transition-colors">
                                        <X size={24} />
                                    </button>
                                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">REGISTER MACHINE</h3>
                                    <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] mb-10">Add a new supreme machine to your elite garage</p>

                                    <form onSubmit={handleAddVehicle} className="space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-neutral-500 uppercase tracking-widest ml-1">Make</label>
                                                <input required className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-white font-bold" placeholder="e.g. BMW"
                                                    value={newVehicle.make} onChange={e => setNewVehicle({ ...newVehicle, make: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-neutral-500 uppercase tracking-widest ml-1">Model</label>
                                                <input required className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-white font-bold" placeholder="e.g. M4"
                                                    value={newVehicle.model} onChange={e => setNewVehicle({ ...newVehicle, model: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-neutral-500 uppercase tracking-widest ml-1">Year</label>
                                                <input required className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-white font-bold" placeholder="2024"
                                                    value={newVehicle.year} onChange={e => setNewVehicle({ ...newVehicle, year: e.target.value })} />
                                            </div>
                                            <div className="space-y-2 col-span-2">
                                                <label className="text-xs font-black text-neutral-500 uppercase tracking-widest ml-1">Plate Number</label>
                                                <input required className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-white font-bold" placeholder="ABC-1234"
                                                    value={newVehicle.plateNumber} onChange={e => setNewVehicle({ ...newVehicle, plateNumber: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-neutral-500 uppercase tracking-widest ml-1">VIN (Optional)</label>
                                            <input className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-white font-bold" placeholder="Chassis Number"
                                                value={newVehicle.vin} onChange={e => setNewVehicle({ ...newVehicle, vin: e.target.value })} />
                                        </div>
                                        <button disabled={submitting} type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-black py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3">
                                            {submitting ? <Loader2 className="animate-spin" /> : 'REGISTER MACHINE ACCESS'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Manage Modal */}
                        {manageModal && editVehicle && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => { setManageModal(false); setEditVehicle(null); }}></div>
                                <div className="bg-neutral-900 border border-neutral-800 w-full max-w-xl rounded-[3rem] p-10 relative z-10 shadow-2xl animate-in zoom-in-95 duration-300">
                                    <button onClick={() => { setManageModal(false); setEditVehicle(null); }} className="absolute top-8 right-8 text-neutral-500 hover:text-white transition-colors">
                                        <X size={24} />
                                    </button>
                                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">MANAGE MACHINE</h3>
                                    <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] mb-10">Updating system logs for {editVehicle.make} {editVehicle.model}</p>

                                    <form onSubmit={handleUpdateVehicle} className="space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-neutral-500 uppercase tracking-widest ml-1">Make</label>
                                                <input required className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-white font-bold"
                                                    value={editVehicle.make} onChange={e => setEditVehicle({ ...editVehicle, make: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-neutral-500 uppercase tracking-widest ml-1">Model</label>
                                                <input required className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-white font-bold"
                                                    value={editVehicle.model} onChange={e => setEditVehicle({ ...editVehicle, model: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-neutral-500 uppercase tracking-widest ml-1">Year</label>
                                                <input required className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-white font-bold"
                                                    value={editVehicle.year} onChange={e => setEditVehicle({ ...editVehicle, year: e.target.value })} />
                                            </div>
                                            <div className="space-y-2 col-span-2">
                                                <label className="text-xs font-black text-neutral-500 uppercase tracking-widest ml-1">Plate Number</label>
                                                <input required className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-white font-bold"
                                                    value={editVehicle.plateNumber} onChange={e => setEditVehicle({ ...editVehicle, plateNumber: e.target.value })} />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-4 mt-10">
                                            <button disabled={submitting} type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-black py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3">
                                                {submitting ? <Loader2 className="animate-spin" /> : 'SAVE CHANGES'}
                                            </button>
                                            <button
                                                disabled={submitting}
                                                type="button"
                                                onClick={() => handleDeleteVehicle(editVehicle.id)}
                                                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-[0.98]"
                                            >
                                                REMOVE MACHINE FROM GARAGE
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Array.isArray(vehicles) && vehicles.length > 0 ? vehicles.map((v) => (
                                <div key={v.id} className="bg-neutral-900 border border-neutral-800 p-8 rounded-[2.5rem] group hover:border-neutral-700 transition-all duration-300 relative overflow-hidden shadow-2xl">
                                    <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:opacity-10 transition-opacity rotate-[-15deg]">
                                        <Car size={160} />
                                    </div>
                                    <div className="flex justify-between items-start relative z-10">
                                        <div>
                                            <p className="text-amber-500 font-black text-xs uppercase tracking-widest mb-2">{v.year} {v.make}</p>
                                            <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">{v.model}</h3>
                                            <p className="text-neutral-500 font-mono text-xs mt-4 tracking-widest uppercase">{v.plateNumber}</p>
                                        </div>
                                        <button
                                            onClick={() => { setEditVehicle({ ...v }); setManageModal(true); }}
                                            className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 text-neutral-400 hover:text-amber-500 transition-colors active:scale-90"
                                        >
                                            <Settings size={20} />
                                        </button>
                                    </div>
                                    <div className="mt-10 pt-8 border-t border-neutral-800 flex items-center justify-between relative z-10">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-1">Service Intelligence</span>
                                            {(() => {
                                                const activeJob = jobs.find(j => j.vehicleId === v.id && j.status !== 'RELEASED');
                                                const releasedJobs = jobs.filter(j => j.vehicleId === v.id && j.status === 'RELEASED');
                                                const lastService = releasedJobs.length > 0
                                                    ? new Date(Math.max(...releasedJobs.map(j => new Date(j.updatedAt)))).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                                    : 'Awaiting Records';

                                                return (
                                                    <div className="flex flex-col">
                                                        <span className={`text-xs font-black uppercase tracking-widest ${lastService === 'Awaiting Records' ? 'text-neutral-700' : 'text-amber-500/80'}`}>
                                                            {lastService === 'Awaiting Records' ? 'Awaiting Service' : `Last: ${lastService}`}
                                                        </span>
                                                        {activeJob ? (
                                                            <Link to={`/track?job=${activeJob.jobNumber}&plate=${v.plateNumber}`} className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-2 flex items-center gap-1 hover:text-emerald-400 transition-colors">
                                                                <Clock size={10} /> Active Tracking Enabled
                                                            </Link>
                                                        ) : (
                                                            <Link to="/book" className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-2 flex items-center gap-1 hover:text-white transition-colors">
                                                                <Calendar size={10} /> Schedule Performance Check
                                                            </Link>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-full bg-neutral-900/50 border border-dashed border-neutral-800 p-12 rounded-[2.5rem] text-center">
                                    <Car size={48} className="mx-auto text-neutral-800 mb-4" />
                                    <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">No supreme machines registered yet</p>
                                </div>
                            )}
                        </div>

                        {/* Recent History Section */}
                        <div className="mt-16 pt-16 border-t border-neutral-900">
                            <h2 className="text-xl font-black text-white tracking-widest uppercase flex items-center gap-3 mb-10">
                                <History className="text-amber-500" size={24} />
                                Repair History
                            </h2>
                            <div className="space-y-4">
                                {Array.isArray(jobs) && jobs.length > 0 ? jobs.slice(0, 3).map((job) => (
                                    <div key={job.id} className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 hover:border-neutral-700 transition-colors group">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-neutral-950 flex items-center justify-center border border-neutral-800 text-amber-500 group-hover:scale-110 transition-transform">
                                                <Clock size={24} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-black text-white uppercase tracking-tight italic">{job.jobNumber}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${job.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                        }`}>
                                                        {job.status}
                                                    </span>
                                                </div>
                                                <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-2">Comprehensive engine diagnostic & tuning</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 w-full sm:w-auto">
                                            <div className="text-right flex-1 sm:flex-initial">
                                                <p className="text-white font-black text-sm tracking-tight">₱{Number(invoices.find(i => i.jobOrderId === job.id)?.totalAmount || job.estimatedCost || 0).toLocaleString()}.00</p>
                                                <p className="text-neutral-600 text-[10px] font-black uppercase tracking-widest mt-0.5">{invoices.find(i => i.jobOrderId === job.id) ? 'Payment Settled' : 'Awaiting Final Billing'}</p>
                                            </div>
                                            {invoices.find(i => i.jobOrderId === job.id) && (
                                                <Link to={`/receipt/${invoices.find(i => i.jobOrderId === job.id).id}`} className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 hover:border-amber-500/50 text-neutral-400 hover:text-white group-hover:text-amber-500 transition-all">
                                                    <FileText size={18} />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-12 text-center bg-neutral-900/30 rounded-3xl border border-neutral-900">
                                        <p className="text-neutral-700 font-black uppercase text-xs tracking-widest">Awaiting first service record</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions Sidebar */}
                    <div className="space-y-8">
                        <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-white/20 blur-[40px] rounded-full"></div>
                            <h2 className="text-3xl font-black text-black tracking-tighter italic uppercase leading-tight relative z-10 mb-2">QUICK BOOKING</h2>
                            <p className="text-black/60 font-black uppercase tracking-widest text-xs mb-10 relative z-10">Instant service request</p>
                            <Link to="/book" className="w-full bg-black text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 group-hover:scale-105 transition-all active:scale-95 shadow-2xl relative z-10">
                                SCHEDULE NOW <ArrowRight size={18} />
                            </Link>
                        </div>

                        <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-[2.5rem] space-y-6">
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-4">Supreme Tools</h3>
                            <Link to="/shop" className="flex items-center justify-between p-4 bg-neutral-950 rounded-2xl border border-neutral-800 hover:border-amber-500/50 transition-all group/tool">
                                <div className="flex items-center gap-4">
                                    <div className="bg-amber-500/10 p-2 rounded-xl text-amber-500 group-hover/tool:scale-110 transition-transform">
                                        <Package size={20} />
                                    </div>
                                    <span className="text-xs font-black text-neutral-400 group-hover/tool:text-white transition-colors uppercase tracking-widest">Browse Parts</span>
                                </div>
                                <ChevronRight size={16} className="text-neutral-700" />
                            </Link>
                            <Link to="/track" className="flex items-center justify-between p-4 bg-neutral-950 rounded-2xl border border-neutral-800 hover:border-amber-500/50 transition-all group/tool">
                                <div className="flex items-center gap-4">
                                    <div className="bg-amber-500/10 p-2 rounded-xl text-amber-500 group-hover/tool:scale-110 transition-transform">
                                        <Wrench size={20} />
                                    </div>
                                    <span className="text-xs font-black text-neutral-400 group-hover/tool:text-white transition-colors uppercase tracking-widest">Real-time Tracker</span>
                                </div>
                                <ChevronRight size={16} className="text-neutral-700" />
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MyGarage;
