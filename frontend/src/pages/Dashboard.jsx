import React, { useEffect, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    Clock,
    CheckCircle2,
    ShieldCheck,
    AlertCircle,
    TrendingUp,
    Wrench,
    Download,
    FileText,
    ShoppingCart,
    Wallet,
    Lock
} from 'lucide-react';
import api from '../api/client';
import { useNotification } from '../context/NotificationContext';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Dashboard = () => {
    const notify = useNotification();
    const [data, setData] = useState({
        revenueChart: [],
        jobStatus: [],
        mechanicStats: []
    });
    const [stats, setStats] = useState({
        activeJobs: 0,
        urgentJobs: 0,
        lowStock: 0,
        monthlyRevenue: 0
    });
    const [recentJobs, setRecentJobs] = useState([]);
    const [wallet, setWallet] = useState(null);
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [pin, setPin] = useState('');
    const [reportType, setReportType] = useState(null); // 'WITHDRAW' or 'SALES_EXCEL'
    const [step, setStep] = useState('PIN');
    const [twoFactorToken, setTwoFactorToken] = useState('');
    const [withdrawMethod, setWithdrawMethod] = useState('');
    const [accountNumber, setAccountNumber] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dashboardRes, jobsRes, partsRes, revenueRes, walletRes, activityRes] = await Promise.all([
                    api.get('/reports/dashboard'),
                    api.get('/job-orders?isArchived=false'),
                    api.get('/reports/stock-alerts'),
                    api.get('/reports/revenue'),
                    api.get('/reports/wallet'),
                    api.get('/reports/activity')
                ]);

                setData(dashboardRes.data || { revenueChart: [], jobStatus: [], mechanicStats: [] });
                setWallet(walletRes.data || { availableBalance: 0, totalEarnings: 0, totalWithdrawn: 0 });
                setRecentJobs(Array.isArray(activityRes.data) ? activityRes.data : []);

                const jobs = Array.isArray(jobsRes.data) ? jobsRes.data : [];
                const parts = Array.isArray(partsRes.data) ? partsRes.data : [];

                setStats({
                    activeJobs: jobs.filter(j => j.status !== 'RELEASED' && j.status !== 'COMPLETED').length,
                    urgentJobs: jobs.filter(j => j.priority === 'URGENT' && j.status !== 'COMPLETED').length,
                    lowStock: parts.length,
                    monthlyRevenue: revenueRes.data?.total || 0
                });
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            }
        };
        fetchData();
    }, []);

    const handleExportRevenue = async () => {
        try {
            const response = await api.get('/reports/export/revenue', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'revenue_report.csv');
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            console.error('Export failed:', error);
            notify.error('Failed to export revenue');
        }
    };

    const handleExportSalesExcel = async () => {
        try {
            const response = await api.get('/reports/export/sales-profit', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Sales_Profit_Report.xlsx');
            document.body.appendChild(link);
            link.click();
            setShowWithdraw(false); // Close the PIN modal
            setPin('');
        } catch (error) {
            console.error('Excel Export failed:', error);
            notify.error('Failed to generate Excel report');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase">Workshop Overview</h1>
                    <p className="text-neutral-500 mt-1 font-medium tracking-wide">REAL-TIME INSIGHTS & PERFORMANCE METRICS</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportRevenue}
                        className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 px-4 py-3 rounded-2xl transition-all border border-neutral-800 shadow-xl active:scale-95 font-black text-[10px] tracking-widest uppercase"
                    >
                        <Download size={16} className="text-blue-500" />
                        <span>CSV Export</span>
                    </button>
                    <button
                        onClick={() => {
                            setReportType('SALES_EXCEL');
                            setStep('PIN');
                            setShowWithdraw(true);
                        }}
                        className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 px-6 py-3 rounded-2xl transition-all border border-neutral-800 shadow-xl active:scale-95 font-black text-xs tracking-widest uppercase group"
                    >
                        <FileText size={18} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                        <span>Full Sales/Profit Report</span>
                    </button>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {[
                    { label: 'Active Jobs', value: stats.activeJobs, icon: <Wrench size={24} />, color: 'bg-amber-500/10 text-amber-500', hover: 'hover:border-amber-500/30' },
                    { label: 'Urgent Attention', value: stats.urgentJobs, icon: <AlertCircle size={24} />, color: 'bg-red-500/10 text-red-500', hover: 'hover:border-red-500/30' },
                    { label: 'Web Orders', value: data?.onlineOrders || 0, icon: <ShoppingCart size={24} />, color: 'bg-indigo-500/10 text-indigo-500', hover: 'hover:border-indigo-500/30' },
                    { label: 'Monthly Revenue', value: `₱${Number(stats.monthlyRevenue || 0).toLocaleString()}`, icon: <TrendingUp size={24} />, color: 'bg-emerald-500/10 text-emerald-500', hover: 'hover:border-emerald-500/30' },
                    { label: 'Low Stock Items', value: stats.lowStock, icon: <FileText size={24} />, color: 'bg-blue-500/10 text-blue-500', hover: 'hover:border-blue-500/30' }
                ].map((item, idx) => (
                    <div key={idx} className={`bg-neutral-900/50 backdrop-blur-md border border-neutral-800 p-6 rounded-[2rem] flex items-center gap-4 group ${item.hover} transition-all duration-300 shadow-2xl`}>
                        <div className={`p-4 rounded-2xl ${item.color} group-hover:scale-110 transition-transform duration-300`}>
                            {item.icon}
                        </div>
                        <div>
                            <p className="text-neutral-500 text-xs font-black uppercase tracking-widest">{item.label}</p>
                            <p className="text-2xl font-black text-white mt-1 tracking-tight">{item.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Store Wallet Section */}
            <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800 p-8 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                    <h3 className="text-sm font-black text-neutral-500 uppercase tracking-widest mb-2">Store Wallet Balance</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-white tracking-tighter">₱{Number(wallet?.availableBalance || 0).toLocaleString()}</span>
                        <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg uppercase tracking-wider">Available</span>
                    </div>
                    <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest mt-2">{wallet?.totalEarnings ? `Lifetime: ₱${Number(wallet.totalEarnings).toLocaleString()}` : 'Loading...'}</p>
                </div>
                <div className="flex gap-6 items-center">
                    <div className="text-right hidden md:block">
                        <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Total Withdrawn</p>
                        <p className="text-xl font-black text-neutral-400">₱{Number(wallet?.totalWithdrawn || 0).toLocaleString()}</p>
                    </div>
                    <button
                        onClick={() => {
                            if ((wallet?.availableBalance || 0) <= 0) return notify.error('No funds available for withdrawal');
                            setReportType('WITHDRAW');
                            setStep('PIN');
                            setShowWithdraw(true);
                        }}
                        className="bg-amber-500 hover:bg-amber-400 text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-amber-500/20 active:scale-95 flex items-center gap-2"
                    >
                        <Wallet size={18} /> WITHDRAW ENTIRE BALANCE
                    </button>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Chart */}
                <div className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800 p-8 rounded-[2.5rem] shadow-2xl">
                    <h3 className="text-sm font-black text-white mb-8 uppercase tracking-[0.2em]">Revenue Trend (6 Months)</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.revenueChart}>
                                <defs>
                                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.05} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                                <XAxis dataKey="month" stroke="#737373" fontSize={10} tick={{ fontWeight: 'black' }} tickLine={false} axisLine={false} />
                                <YAxis stroke="#737373" fontSize={10} tick={{ fontWeight: 'black' }} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(245, 158, 11, 0.05)' }}
                                    contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#262626', borderRadius: '16px', color: '#f5f5f5', fontSize: '12px', fontWeight: '900' }}
                                />
                                <Bar dataKey="revenue" fill="url(#revenueGradient)" stroke="#f59e0b" strokeWidth={2} radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Job Status Distribution */}
                <div className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800 p-8 rounded-[2.5rem] shadow-2xl">
                    <h3 className="text-sm font-black text-white mb-8 uppercase tracking-[0.2em]">Job Status Distribution</h3>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 h-[300px]">
                        <div className="relative w-full md:w-1/2 h-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.jobStatus}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={75}
                                        outerRadius={105}
                                        paddingAngle={8}
                                        dataKey="count"
                                        stroke="none"
                                        animationBegin={0}
                                        animationDuration={1500}
                                    >
                                        {data.jobStatus.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#262626', borderRadius: '16px', color: '#f5f5f5', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}
                                        itemStyle={{ color: '#f59e0b' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Central Stats */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                <p className="text-4xl font-black text-white italic leading-none">{data.jobStatus.reduce((acc, curr) => acc + Number(curr.count), 0)}</p>
                                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-1">Total Jobs</p>
                            </div>
                        </div>
                        <div className="w-full md:w-1/2 space-y-3">
                            {data.jobStatus.map((entry, index) => (
                                <div key={index} className="flex items-center justify-between p-3 rounded-2xl bg-neutral-950 border border-neutral-800/50 group hover:border-neutral-700 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{entry.status}</span>
                                    </div>
                                    <span className="text-sm font-black text-white italic">{entry.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Mechanics Performance */}
            {data.mechanicStats && data.mechanicStats.length > 0 && (
                <div className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800 p-8 rounded-[2.5rem] shadow-2xl">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Efficiency Leaderboard</h3>
                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Current Month Status</p>
                        </div>
                        <div className="bg-amber-500/10 text-amber-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                            Performance Tracking
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {data.mechanicStats.map((mech, idx) => (
                            <div key={idx} className="bg-neutral-950 p-6 rounded-[2rem] border border-neutral-800 flex items-center justify-between group hover:border-amber-500/30 transition-all shadow-xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-500 font-black text-xl shadow-inner group-hover:scale-110 transition-transform">
                                        {mech.name[0]}
                                    </div>
                                    <div>
                                        <p className="text-white font-black uppercase text-xs tracking-tight">{mech.name}</p>
                                        <p className="text-neutral-500 text-[9px] font-bold uppercase tracking-widest mt-0.5">Specialist</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-white italic">{mech.jobsCompleted}</p>
                                    <p className="text-[9px] text-neutral-600 font-black uppercase tracking-widest">Completed</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Urgent Jobs */}
            <div className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-neutral-800 flex justify-between items-center">
                    <h2 className="text-sm font-black text-white flex items-center gap-3 uppercase tracking-[0.2em]">
                        <span>Recent Activity</span>
                        <div className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-black border border-amber-500/20">LIVE</div>
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-neutral-900/50 text-neutral-500 text-xs font-black uppercase tracking-widest">
                                <th className="px-8 py-5">Type</th>
                                <th className="px-8 py-5">Reference</th>
                                <th className="px-8 py-5">Details</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5">Info</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800">
                            {recentJobs.length > 0 ? recentJobs.map((item) => (
                                <tr key={`${item.type}-${item.id}`} className="hover:bg-neutral-800/20 transition-colors group">
                                    <td className="px-8 py-5">
                                        {item.type === 'PAYOUT' ? (
                                            <span className="inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_15px_-5px_rgba(16,185,129,0.3)]">
                                                PAYOUT
                                            </span>
                                        ) : item.priority === 'URGENT' ? (
                                            <span className="inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-black bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse">
                                                URGENT
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-black bg-neutral-800 text-neutral-500 border border-neutral-700">
                                                NORMAL
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-8 py-5 font-black text-amber-500 text-xs tracking-widest">
                                        {item.title}
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col">
                                            {item.type === 'JOB' ? (
                                                <>
                                                    <span className="text-white font-black text-xs uppercase tracking-tight">{item.subtitle.split('•')[1] || 'Unknown'}</span>
                                                    <span className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-0.5">{item.subtitle.split('•')[0]}</span>
                                                </>
                                            ) : (
                                                <span className="text-white font-black text-xs uppercase tracking-tight">{item.subtitle}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-black border uppercase tracking-widest ${item.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                            item.status === 'RECEIVED' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-neutral-400 text-xs font-black uppercase tracking-widest">
                                        {item.amount ? `₱${Number(item.amount).toLocaleString()}` : item.detail}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-12 text-center text-neutral-600 font-black uppercase text-xs tracking-widest">No recent activity.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Withdrawal Modal */}
            {
                showWithdraw && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setShowWithdraw(false); setStep('PIN'); setPin(''); }}></div>
                        <div className="relative bg-neutral-900 border border-neutral-800 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
                            {/* Header */}
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
                                    <ShieldCheck size={32} className="text-amber-500" />
                                </div>
                                <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">
                                    {step === 'PIN' ? 'Security Check' : step === 'CONFIRM' ? 'Review Transfer' : 'Withdrawal Method'}
                                </h3>
                                <p className="text-neutral-500 font-bold text-xs uppercase tracking-widest mt-2">
                                    {step === 'PIN' ? 'Enter Security PIN' : step === 'CONFIRM' ? 'Please review details below' : 'Select Destination'}
                                </p>
                            </div>

                            {/* Step 1: PIN Input */}
                            {step === 'PIN' && (
                                <div className="space-y-6">
                                    <div className="relative group">
                                        <input
                                            type="password"
                                            autoFocus
                                            maxLength={6}
                                            placeholder="••••••"
                                            className="w-full bg-neutral-950 border border-neutral-800 text-center text-3xl font-black text-white py-6 rounded-2xl focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none tracking-[0.5em] transition-all"
                                            value={pin}
                                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                        />
                                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-neutral-900 px-3 py-1 rounded-full border border-neutral-800 flex items-center gap-2">
                                            <Lock size={10} className="text-amber-500" />
                                            <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest">End-to-End Encrypted</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => { setShowWithdraw(false); setPin(''); }}
                                            className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            disabled={!pin || pin.length < 6}
                                            onClick={() => {
                                                api.post('/reports/verify-pin', { pin }).then(() => {
                                                    if (reportType === 'SALES_EXCEL') {
                                                        handleExportSalesExcel();
                                                    } else {
                                                        if (user?.twoFactorEnabled) {
                                                            setStep('2FA');
                                                        } else {
                                                            setStep('SELECT');
                                                        }
                                                    }
                                                }).catch(err => {
                                                    notify.error(err.response?.data?.message || 'Invalid Security PIN');
                                                    setPin('');
                                                });
                                            }}
                                            className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:bg-neutral-800 text-black py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-amber-500/20 active:scale-95"
                                        >
                                            {reportType === 'SALES_EXCEL' ? 'Verify & Download' : 'Verify & Continue'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 1.5: 2FA Verification */}
                            {step === '2FA' && (
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-2 border border-blue-500/20">
                                            <Smartphone size={24} className="text-blue-500" />
                                        </div>
                                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Secondary Verification Required</p>
                                    </div>
                                    <input
                                        type="text"
                                        autoFocus
                                        maxLength={6}
                                        placeholder="000000"
                                        className="w-full bg-neutral-950 border border-neutral-800 text-center text-3xl font-black text-white py-4 rounded-2xl focus:border-blue-500 outline-none tracking-[0.5em] transition-all"
                                        value={twoFactorToken}
                                        onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, ''))}
                                    />
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => { setStep('PIN'); setTwoFactorToken(''); }}
                                            className="flex-1 bg-neutral-800 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest"
                                        >
                                            Back
                                        </button>
                                        <button
                                            disabled={twoFactorToken.length < 6}
                                            onClick={() => setStep('SELECT')}
                                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all"
                                        >
                                            Verify & Continue
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Method Selection */}
                            {step === 'SELECT' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 gap-3">
                                        {['BANK TRANSFER', 'GCASH', 'PAYMAYA'].map((m) => (
                                            <button
                                                key={m}
                                                onClick={() => setWithdrawMethod(m)}
                                                className={`p-4 rounded-xl border font-black uppercase tracking-widest text-xs transition-all ${withdrawMethod === m
                                                    ? 'bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/20'
                                                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                                                    }`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                    {withdrawMethod && (
                                        <input
                                            type="text"
                                            placeholder={withdrawMethod === 'BANK TRANSFER' ? 'Account Number' : 'Mobile Number'}
                                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 outline-none transition-all animate-in fade-in"
                                            value={accountNumber}
                                            onChange={(e) => setAccountNumber(e.target.value)}
                                        />
                                    )}
                                    <div className="flex gap-4 pt-2">
                                        <button
                                            onClick={() => setStep('PIN')}
                                            className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-colors"
                                        >
                                            Back
                                        </button>
                                        <button
                                            disabled={!withdrawMethod || !accountNumber}
                                            onClick={() => setStep('CONFIRM')}
                                            className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:bg-neutral-800 text-black py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-amber-500/20"
                                        >
                                            Review
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Final Confirmation */}
                            {step === 'CONFIRM' && (
                                <div className="space-y-6 text-center animate-in zoom-in-95">
                                    <div className="bg-neutral-950/50 p-6 rounded-2xl border border-neutral-800">
                                        <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-1">Amount to Withdraw</p>
                                        <p className="text-4xl font-black text-white mb-6">₱{wallet?.availableBalance.toLocaleString()}</p>

                                        <div className="flex justify-between items-center py-3 border-b border-neutral-800">
                                            <span className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Method</span>
                                            <span className="text-white text-xs font-black uppercase tracking-widest">{withdrawMethod}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-3">
                                            <span className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Account</span>
                                            <span className="text-white text-xs font-black uppercase tracking-widest text-right">{accountNumber}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-2">
                                        <button
                                            onClick={() => setStep('SELECT')}
                                            className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-colors"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={() => {
                                                api.post('/reports/payout', {
                                                    amount: wallet.availableBalance,
                                                    method: withdrawMethod,
                                                    accountNumber: accountNumber,
                                                    pin: pin,
                                                    twoFactorToken: user?.twoFactorEnabled ? twoFactorToken : undefined
                                                }).then(() => {
                                                    notify.success('Transferred Successfully!');
                                                    setShowWithdraw(false);
                                                    setTimeout(() => window.location.reload(), 1500);
                                                }).catch(err => notify.error(err.response?.data?.message || 'Transaction Failed'));
                                            }}
                                            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-emerald-500/20"
                                        >
                                            Confirm Transfer
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Dashboard;
