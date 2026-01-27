import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    User, Phone, Mail, MapPin,
    FileText, Wrench, Calendar,
    Clock, CheckCircle, AlertCircle,
    ArrowLeft, Car, FolderOpen
} from 'lucide-react';
import api from '../api/client';

const CustomerHistory = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('INVOICES');

    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                const res = await api.get(`/customers/${id}`);
                setCustomer(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchCustomer();
    }, [id]);

    if (loading) return <div className="text-white p-10 font-black uppercase tracking-widest">Loading Ledger...</div>;
    if (!customer) return <div className="text-white p-10 font-black uppercase tracking-widest">Customer Not Found</div>;

    const tabs = [
        { id: 'INVOICES', label: 'Billing History', icon: <FileText size={16} /> },
        { id: 'JOBS', label: 'Job Orders', icon: <Wrench size={16} /> },
        { id: 'APPOINTMENTS', label: 'Appointments', icon: <Calendar size={16} /> },
        { id: 'VEHICLES', label: 'Garage', icon: <Car size={16} /> }
    ];

    return (
        <div className="min-h-screen bg-neutral-950 p-6 lg:p-10 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors mb-8 group uppercase text-xs font-black tracking-widest">
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Back to Invoices
            </button>

            <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-8 lg:p-12 shadow-2xl mb-10 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none"></div>
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center text-amber-500 font-black text-3xl uppercase shadow-xl">
                            {customer.name[0]}
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">{customer.name}</h1>
                            <p className="text-amber-500 font-bold uppercase tracking-[0.2em] text-xs mt-1">Valued Client</p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 text-neutral-400 text-sm font-medium">
                        <div className="flex items-center gap-3 bg-neutral-950/50 px-4 py-2 rounded-xl border border-neutral-800">
                            <Mail size={16} className="text-amber-600" />
                            <span>{customer.email}</span>
                        </div>
                        <div className="flex items-center gap-3 bg-neutral-950/50 px-4 py-2 rounded-xl border border-neutral-800">
                            <Phone size={16} className="text-amber-600" />
                            <span>{customer.phone}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 scale-105'
                            : 'bg-neutral-900 text-neutral-500 border border-neutral-800 hover:border-neutral-700'
                            }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-[2rem] p-8 min-h-[400px]">

                {/* INVOICES LIST */}
                {activeTab === 'INVOICES' && (
                    <div className="space-y-4">
                        {customer.invoices && customer.invoices.length > 0 ? customer.invoices.map(inv => (
                            <div key={inv.id} className="bg-neutral-950 border border-neutral-800 p-6 rounded-2xl flex justify-between items-center group hover:border-neutral-700 transition-all cursor-pointer" onClick={() => navigate(`/receipt/${inv.id}`)}>
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <p className="text-white font-black uppercase tracking-tight">{inv.invoiceNumber}</p>
                                        <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                                            {new Date(inv.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black text-white italic">₱{inv.totalAmount?.toLocaleString()}</p>
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${inv.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>
                                        {inv.status}
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-20 text-neutral-600 font-black uppercase tracking-widest text-xs flex flex-col items-center gap-4">
                                <FolderOpen size={48} className="opacity-50" />
                                No Billing Records Found
                            </div>
                        )}
                    </div>
                )}

                {/* JOB ORDERS LIST */}
                {activeTab === 'JOBS' && (
                    <div className="space-y-4">
                        {customer.jobOrders && customer.jobOrders.length > 0 ? customer.jobOrders.map(job => (
                            <div key={job.id} className="bg-neutral-950 border border-neutral-800 p-6 rounded-2xl flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                                        <Wrench size={24} />
                                    </div>
                                    <div>
                                        <p className="text-white font-black uppercase tracking-tight">{job.jobNumber}</p>
                                        <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                                            {job.make} {job.model} • {job.plateNumber}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black uppercase px-3 py-1 bg-neutral-800 text-neutral-400 rounded-lg">
                                    {job.status}
                                </span>
                            </div>
                        )) : (
                            <div className="text-center py-20 text-neutral-600 font-black uppercase tracking-widest text-xs flex flex-col items-center gap-4">
                                <FolderOpen size={48} className="opacity-50" />
                                No Job Orders Found
                            </div>
                        )}
                    </div>
                )}

                {/* APPOINTMENTS LIST */}
                {activeTab === 'APPOINTMENTS' && (
                    <div className="space-y-4">
                        {customer.appointments && customer.appointments.length > 0 ? customer.appointments.map(appt => (
                            <div key={appt.id} className="bg-neutral-950 border border-neutral-800 p-6 rounded-2xl flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
                                        <Calendar size={24} />
                                    </div>
                                    <div>
                                        <p className="text-white font-black uppercase tracking-tight">{appt.serviceType}</p>
                                        <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                                            {new Date(appt.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black uppercase px-3 py-1 bg-neutral-800 text-neutral-400 rounded-lg">
                                    {appt.status}
                                </span>
                            </div>
                        )) : (
                            <div className="text-center py-20 text-neutral-600 font-black uppercase tracking-widest text-xs flex flex-col items-center gap-4">
                                <FolderOpen size={48} className="opacity-50" />
                                No Appointments Found
                            </div>
                        )}
                    </div>
                )}

                {/* VEHICLES LIST */}
                {activeTab === 'VEHICLES' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {customer.vehicles && customer.vehicles.length > 0 ? customer.vehicles.map(v => (
                            <div key={v.id} className="bg-neutral-950 border border-neutral-800 p-6 rounded-2xl">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
                                        <Car size={24} />
                                    </div>
                                    <div>
                                        <p className="text-white font-black uppercase tracking-tight">{v.plateNumber}</p>
                                        <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-1">
                                            {v.year} {v.make} {v.model}
                                        </p>
                                        <p className="text-neutral-600 text-[10px] font-black uppercase mt-2">VIN: {v.vin}</p>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full text-center py-20 text-neutral-600 font-black uppercase tracking-widest text-xs flex flex-col items-center gap-4">
                                <FolderOpen size={48} className="opacity-50" />
                                No Vehicles Registered
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default CustomerHistory;
