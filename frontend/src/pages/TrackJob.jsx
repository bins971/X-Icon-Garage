import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Loader2, CheckCircle2, Circle, AlertCircle, Clock, Wrench, FileText } from 'lucide-react';
import api from '../api/client';

const TrackJob = () => {
    const [searchParams] = useSearchParams();
    const [search, setSearch] = useState({
        jobNumber: searchParams.get('job') || '',
        plateNumber: searchParams.get('plate') || ''
    });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (search.jobNumber && search.plateNumber) {
            handleTrack();
        }
    }, []);

    const handleTrack = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);
        try {
            const res = await api.post('/public/track', search);
            setResult(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to find job order. Please check your inputs.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusStep = (status) => {
        const steps = ['RECEIVED', 'IN_PROGRESS', 'QUALITY_CHECK', 'COMPLETED', 'RELEASED'];
        let currentIndex = steps.indexOf(status);
        if (currentIndex === -1) currentIndex = 0; // Default or cancelled
        return currentIndex;
    };

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-4 shadow-lg shadow-amber-500/10">
                        <Wrench size={40} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Track Your Repair</h1>
                    <p className="text-neutral-400 mt-2">Enter your Job Order Number and Plate Number to see real-time updates.</p>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl">
                    <form onSubmit={handleTrack} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-1.5">Job Order Number</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 text-neutral-600" size={20} />
                                <input
                                    type="text"
                                    placeholder="Job / Booking Ref (e.g., APT-X92A)"
                                    required
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder:text-neutral-600"
                                    value={search.jobNumber}
                                    onChange={(e) => setSearch({ ...search, jobNumber: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-1.5">Vehicle Plate Number</label>
                            <div className="relative">
                                <div className="absolute left-3 top-3 text-neutral-600 font-bold text-xs border border-neutral-600 rounded px-1">ABC</div>
                                <input
                                    type="text"
                                    placeholder="Plate Number or Phone"
                                    required
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder:text-neutral-600"
                                    value={search.plateNumber}
                                    onChange={(e) => setSearch({ ...search, plateNumber: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black py-4 rounded-xl transition-all shadow-xl shadow-amber-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Track Status'}
                        </button>
                    </form>

                    {error && (
                        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 animate-in slide-in-from-top-2">
                            <AlertCircle size={20} className="mt-0.5 shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}
                </div>

                {result && (
                    <div className="mt-8 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl animate-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-start mb-6 pb-6 border-b border-neutral-800">
                            <div>
                                <h2 className="text-xl font-bold text-white">{result.vehicle}</h2>
                                <p className="text-neutral-400 text-sm mt-1">Job #: <span className="font-mono text-amber-400">{result.jobNumber}</span></p>
                            </div>
                            <div className={`px-4 py-1.5 rounded-full text-xs font-bold border ${result.priority === 'URGENT' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                                }`}>
                                {result.priority}
                            </div>
                        </div>

                        <div className="relative flex justify-between items-center mb-8 px-2">
                            {/* Progress Line */}
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-neutral-800 -z-0"></div>
                            <div
                                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-amber-600 transition-all duration-1000 -z-0"
                                style={{ width: `${(getStatusStep(result.status) / 4) * 100}%` }}
                            ></div>

                            {['Received', 'In Progress', 'Checks', 'Ready'].map((step, idx) => {
                                const current = getStatusStep(result.status);
                                const isCompleted = idx <= current;
                                const isCurrent = idx === current;

                                return (
                                    <div key={idx} className="relative z-10 flex flex-col items-center gap-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${isCompleted ? 'bg-amber-600 border-amber-600 text-white' : 'bg-neutral-950 border-neutral-700 text-neutral-700'
                                            }`}>
                                            {isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                                        </div>
                                        <span className={`text-xs font-black uppercase tracking-widest ${isCurrent ? 'text-amber-400' : isCompleted ? 'text-white' : 'text-neutral-600'
                                            }`}>{step}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="bg-neutral-950 rounded-xl p-4 flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-neutral-900 rounded-lg text-neutral-400">
                                    <Wrench size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-neutral-500 text-xs">Assigned Mechanic</span>
                                    <span className="text-white font-medium">{result.mechanic}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-neutral-900 rounded-lg text-neutral-400">
                                    <Clock size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-neutral-500 text-xs">Last Update</span>
                                    <span className="text-white font-medium">{new Date(result.lastUpdated).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        {result.invoiceId && (
                            <div className="mt-6 flex flex-col md:flex-row gap-4 items-center justify-between p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                                <div>
                                    <p className="text-white font-black uppercase text-xs tracking-widest">Digital Receipt Available</p>
                                    <p className="text-amber-500/80 text-[10px] font-bold uppercase mt-1">Status: {result.invoiceStatus}</p>
                                </div>
                                <button
                                    onClick={() => window.location.href = `/receipt/${result.invoiceId}`}
                                    className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2"
                                >
                                    <FileText size={14} /> View Receipt
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <p className="text-center text-neutral-600 text-xs mt-12 mb-8">
                    &copy; 2026 X-ICON GARAGE. ELITE SERVICE TRACKING.
                </p>
            </div>
        </div>
    );
};

export default TrackJob;
