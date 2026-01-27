import React, { useState, useEffect } from 'react';
import {
    Plus, Search, Filter, Calendar, User,
    MoreVertical, FileText, Image as ImageIcon,
    Trash2, AlertCircle, Archive, Upload
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import api from '../api/client';

const JobOrderList = () => {
    const notify = useNotification();
    const [jobs, setJobs] = useState([]);
    const [filters, setFilters] = useState({ status: '', priority: '', isArchived: false });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch Jobs
    const fetchJobs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.priority) params.append('priority', filters.priority);
            params.append('isArchived', filters.isArchived);

            const res = await api.get(`/job-orders?${params.toString()}`);
            setJobs(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchJobs(); }, [filters]);

    // Handlers
    const handleArchive = async (id) => {
        if (!confirm('Are you sure you want to archive this job?')) return;
        try {
            await api.delete(`/job-orders/${id}`);
            notify.success('Job order archived');
            fetchJobs();
        } catch (error) {
            notify.error('Failed to archive job');
        }
    };

    const handleFileUpload = async (e, jobOrderId) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post(`/upload/${jobOrderId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            notify.success('File uploaded successfully');
        } catch (error) {
            notify.error('Upload failed');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Job Orders</h1>
                    <p className="text-slate-400 mt-1">Manage workshop jobs, priorities, and assignments.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all active:scale-95 font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/10"
                >
                    <Plus size={20} /> New Job Order
                </button>
            </div>

            {/* Filters */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-slate-400">
                    <Filter size={18} />
                    <span className="text-sm font-medium">Filters:</span>
                </div>

                <select
                    className="bg-slate-950 border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                    <option value="">All Statuses</option>
                    <option value="RECEIVED">Received</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                </select>

                <select
                    className="bg-slate-950 border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                >
                    <option value="">All Priorities</option>
                    <option value="NORMAL">Normal</option>
                    <option value="URGENT">Urgent</option>
                </select>

                <label className="flex items-center gap-2 text-slate-400 text-sm cursor-pointer ml-auto">
                    <input
                        type="checkbox"
                        checked={filters.isArchived}
                        onChange={(e) => setFilters({ ...filters, isArchived: e.target.checked })}
                        className="rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-offset-0"
                    />
                    Show Archived
                </label>
            </div>

            {/* Job Board */}
            <div className="grid grid-cols-1 gap-4">
                {jobs.map(job => (
                    <div key={job.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-all group relative">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                <div className={`p-3 rounded-xl h-fit ${job.priority === 'URGENT' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                                    }`}>
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-bold text-white">{job.jobNumber}</h3>
                                        {job.priority === 'URGENT' && (
                                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500 text-white animate-pulse">URGENT</span>
                                        )}
                                        {job.isArchived === 1 && (
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">ARCHIVED</span>
                                        )}
                                    </div>
                                    <p className="text-slate-400 mt-1">{job.customerName} • {job.make} {job.model} ({job.plateNumber})</p>
                                    <div className="mt-3 flex items-center gap-6 text-sm text-slate-500">
                                        <span className="flex items-center gap-1.5"><User size={14} /> {job.mechanicName || 'Unassigned'}</span>
                                        <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(job.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {job.notes && (
                                        <div className="mt-3 p-3 bg-slate-950/50 rounded-lg text-sm text-slate-400 border border-slate-800/50">
                                            <span className="font-semibold text-slate-500 block mb-1">Notes:</span>
                                            {job.notes}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${job.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                    job.status === 'RECEIVED' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                        'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                    }`}>
                                    {job.status}
                                </span>

                                <div className="relative">
                                    <label className="p-2 hover:bg-slate-800 rounded-lg cursor-pointer text-slate-400 hover:text-white transition-colors" title="Upload Attachment">
                                        <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, job.id)} />
                                        <Upload size={18} />
                                    </label>
                                </div>

                                <button
                                    onClick={() => handleArchive(job.id)}
                                    className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg text-slate-400 transition-colors"
                                    title="Archive Job"
                                >
                                    <Archive size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {jobs.length === 0 && !loading && (
                    <div className="text-center py-12 text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                        <p>No job orders found matching your filters.</p>
                    </div>
                )}
            </div>

            {/* Create Job Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Create New Job Order</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                                <Trash2 className="rotate-45" size={24} />
                            </button>
                        </div>

                        <CreateJobForm onSuccess={() => {
                            setShowCreateModal(false);
                            fetchJobs();
                        }} />
                    </div>
                </div>
            )}
        </div>
    );
};

const CreateJobForm = ({ onSuccess }) => {
    const notify = useNotification();
    const [customers, setCustomers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [formData, setFormData] = useState({
        customerId: '',
        vehicleId: '',
        complaint: '',
        estimatedCost: '',
        estimatedTime: '',
        priority: 'NORMAL',
        notes: ''
    });

    useEffect(() => {
        const loadData = async () => {
            const [custRes, vehRes] = await Promise.all([
                api.get('/customers'),
                api.get('/vehicles')
            ]);
            setCustomers(custRes.data);
            setVehicles(vehRes.data);
        };
        loadData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/job-orders', formData);
            notify.success('Job Order Created!');
            onSuccess();
        } catch (error) {
            notify.error('Error creating job');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Customer</label>
                    <select
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:border-blue-500 outline-none"
                        value={formData.customerId}
                        onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    >
                        <option value="">Select Customer</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Vehicle</label>
                    <select
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:border-blue-500 outline-none"
                        value={formData.vehicleId}
                        onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                    >
                        <option value="">Select Vehicle</option>
                        {vehicles.filter(v => v.customerId == formData.customerId).map(v =>
                            <option key={v.id} value={v.id}>{v.make} {v.model} ({v.plateNumber})</option>
                        )}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Priority</label>
                    <select
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:border-blue-500 outline-none"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                        <option value="NORMAL">Normal</option>
                        <option value="URGENT">Urgent</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Est. Completion</label>
                    <input
                        type="datetime-local"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:border-blue-500 outline-none"
                        value={formData.estimatedTime}
                        onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Complaint / Issue</label>
                <textarea
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:border-blue-500 outline-none h-24 resize-none"
                    value={formData.complaint}
                    onChange={(e) => setFormData({ ...formData, complaint: e.target.value })}
                ></textarea>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Internal Notes</label>
                <textarea
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:border-blue-500 outline-none h-20 resize-none"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                ></textarea>
            </div>

            <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl transition-all shadow-xl shadow-blue-500/10 active:scale-[0.98] uppercase tracking-widest text-xs mt-4"
            >
                Create Job Order
            </button>
        </form>
    );
};

export default JobOrderList;
