import React, { useState, useEffect } from 'react';
import {
    Plus, Search, Filter, Calendar, User,
    MoreVertical, FileText, Image as ImageIcon,
    Trash2, AlertCircle, Archive, Upload, X, ExternalLink, File, ChevronDown,
    CreditCard, Wallet, ShoppingBag
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import useSearch from '../hooks/useSearch';
import SearchBar from '../components/SearchBar';
import { CardSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';

const JobOrderList = () => {
    const notify = useNotification();
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const { searchTerm, setSearchTerm, filteredData: filteredJobs } = useSearch(jobs, [
        'jobNumber', 'customerName', 'plateNumber'
    ]);
    const [filters, setFilters] = useState({ status: '', priority: '', isArchived: false });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [loading, setLoading] = useState(true);

    // Attachments Modal State
    const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
    const [selectedJobForAttachments, setSelectedJobForAttachments] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [statusUpdating, setStatusUpdating] = useState(null);
    const [confirmArchive, setConfirmArchive] = useState({ show: false, id: null });

    // Billing Modal State
    const [showBillingModal, setShowBillingModal] = useState(false);
    const [selectedJobForBilling, setSelectedJobForBilling] = useState(null);
    const [billingParts, setBillingParts] = useState([]);
    const [inventoryParts, setInventoryParts] = useState([]);
    const [discount, setDiscount] = useState(0);
    const [tax, setTax] = useState(0);
    const [billingLoading, setBillingLoading] = useState(false);
    const [partSearch, setPartSearch] = useState('');

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

    useEffect(() => {
        fetchJobs();
        const interval = setInterval(fetchJobs, 10000); // Refresh every 10 seconds
        return () => clearInterval(interval);
    }, [filters]);

    // Handlers
    const handleArchive = async (id) => {
        setConfirmArchive({ show: true, id });
    };

    const confirmArchiveJob = async () => {
        if (!confirmArchive.id) return;
        try {
            await api.delete(`/job-orders/${confirmArchive.id}`);
            notify.success('Job order archived');
            fetchJobs();
        } catch (error) {
            notify.error('Failed to archive job');
        } finally {
            setConfirmArchive({ show: false, id: null });
        }
    };

    const handleOpenBilling = async (job) => {
        setSelectedJobForBilling(job);
        setShowBillingModal(true);
        setBillingLoading(true);
        try {
            const [partsRes, inventoryRes] = await Promise.all([
                api.get(`/job-orders/${job.id}/parts`),
                api.get('/parts')
            ]);
            setBillingParts(partsRes.data);
            setInventoryParts(inventoryRes.data);
            setDiscount(0);
            setTax(0);
        } catch (error) {
            notify.error('Failed to load billing data');
        } finally {
            setBillingLoading(false);
        }
    };

    const handleAddPartToJob = async (partId) => {
        try {
            await api.post(`/invoices/${selectedJobForBilling.id}/parts`, { partId, quantity: 1 });
            notify.success('Part added to job');
            // Refresh parts
            const res = await api.get(`/job-orders/${selectedJobForBilling.id}/parts`);
            setBillingParts(res.data);
        } catch (error) {
            notify.error(error.response?.data?.message || 'Failed to add part');
        }
    };

    const handleCreateInvoice = async () => {
        try {
            await api.post('/invoices', {
                jobOrderId: selectedJobForBilling.id,
                discount,
                tax
            });
            notify.success('Invoice generated successfully');
            setShowBillingModal(false);
            fetchJobs();
        } catch (error) {
            notify.error('Failed to generate invoice');
        }
    };

    const calculateSubtotal = () => {
        const base = parseFloat(selectedJobForBilling?.estimatedCost) || 0;
        const partsTotal = billingParts.reduce((sum, p) => sum + (p.unitprice * p.quantity), 0);
        return base + partsTotal;
    };

    const handleStatusUpdate = async (jobId, newStatus) => {
        setStatusUpdating(jobId);
        // Optimistic Update
        const previousJobs = [...jobs];
        setJobs(jobs.map(job =>
            job.id === jobId ? { ...job, status: newStatus } : job
        ));

        try {
            await api.patch(`/job-orders/${jobId}/status`, { status: newStatus });
            notify.success('Status updated successfully');
        } catch (error) {
            // Revert on failure
            setJobs(previousJobs);
            notify.error('Failed to update status');
        } finally {
            setStatusUpdating(null);
        }
    };

    const handleViewAttachments = async (job) => {
        setSelectedJobForAttachments(job);
        setShowAttachmentsModal(true);
        fetchAttachments(job.id);
    };

    const fetchAttachments = async (jobId) => {
        try {
            const res = await api.get(`/upload/${jobId}`);
            setAttachments(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post(`/upload/${selectedJobForAttachments.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            notify.success('File uploaded successfully');
            fetchAttachments(selectedJobForAttachments.id);
        } catch (error) {
            notify.error('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    // Filtering Logic (Removed redundant check as useSearch handles it)

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Job Orders</h1>
                    <p className="text-slate-400 mt-1">Manage workshop jobs, priorities, and assignments.</p>
                </div>
                {user?.role !== 'CUSTOMER' && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all active:scale-95 font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/10"
                    >
                        <Plus size={20} /> New Job Order
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-slate-400">
                    <Filter size={18} />
                    <span className="text-sm font-medium">Filters:</span>
                </div>

                <SearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search Job #, Client, or Plate..."
                />

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
            {loading ? (
                <CardSkeleton count={6} />
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredJobs.map(job => (
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
                                    <div className="relative">
                                        {user?.role !== 'CUSTOMER' ? (
                                            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity ${job.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                job.status === 'RECEIVED' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                    'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                }`}>
                                                <select
                                                    className="bg-transparent outline-none appearance-none cursor-pointer"
                                                    value={job.status}
                                                    onChange={(e) => handleStatusUpdate(job.id, e.target.value)}
                                                    disabled={statusUpdating === job.id}
                                                >
                                                    <option value="RECEIVED" className="bg-slate-900 text-blue-500">RECEIVED</option>
                                                    <option value="DIAGNOSING" className="bg-slate-900 text-amber-500">DIAGNOSING</option>
                                                    <option value="IN_PROGRESS" className="bg-slate-900 text-amber-500">IN PROGRESS</option>
                                                    <option value="WAITING_FOR_PARTS" className="bg-slate-900 text-amber-500">WAITING PARTS</option>
                                                    <option value="COMPLETED" className="bg-slate-900 text-emerald-500">COMPLETED</option>
                                                    <option value="RELEASED" className="bg-slate-900 text-emerald-500">RELEASED</option>
                                                </select>
                                                <ChevronDown size={12} />
                                            </div>
                                        ) : (
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${job.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                job.status === 'RECEIVED' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                    'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                }`}>
                                                {job.status}
                                            </span>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handleViewAttachments(job)}
                                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors relative group/btn"
                                        title="View/Upload Attachments"
                                    >
                                        <Upload size={18} />
                                    </button>

                                    {job.invoiceId ? (
                                        <button
                                            onClick={() => window.location.href = `/receipt/${job.invoiceId}`}
                                            className="p-2 hover:bg-amber-500/10 hover:text-amber-500 rounded-lg text-amber-500 transition-colors"
                                            title="View Invoice"
                                        >
                                            <FileText size={18} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleOpenBilling(job)}
                                            className="p-2 hover:bg-emerald-500/10 hover:text-emerald-500 rounded-lg text-slate-400 transition-colors"
                                            title="Finalize Billing"
                                        >
                                            <Wallet size={18} />
                                        </button>
                                    )}

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

                    {/* Billing Modal */}
                    {showBillingModal && selectedJobForBilling && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
                            <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-10 w-full max-w-4xl shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">FINALIZE BILLING</h2>
                                        <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] mt-1">{selectedJobForBilling.jobNumber} • {selectedJobForBilling.customerName}</p>
                                    </div>
                                    <button onClick={() => setShowBillingModal(false)} className="text-neutral-500 hover:text-white transition-colors">
                                        <X size={32} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                    {/* Left: Part Selection & Summary */}
                                    <div className="space-y-8">
                                        <div>
                                            <label className="text-xs font-black text-neutral-500 uppercase tracking-widest block mb-4">Add Parts from Inventory</label>
                                            <div className="relative mb-4">
                                                <Search className="absolute left-4 top-4 text-neutral-600" size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="Search parts by name or number..."
                                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none focus:border-emerald-500 transition-all"
                                                    value={partSearch}
                                                    onChange={(e) => setPartSearch(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                                {inventoryParts
                                                    .filter(p => p.name.toLowerCase().includes(partSearch.toLowerCase()) || p.partNumber.toLowerCase().includes(partSearch.toLowerCase()))
                                                    .slice(0, 5)
                                                    .map(part => (
                                                        <div key={part.id} className="flex items-center justify-between p-4 bg-neutral-950 rounded-2xl border border-neutral-800 hover:border-neutral-600 transition-all group">
                                                            <div>
                                                                <p className="text-white font-black text-xs uppercase">{part.name}</p>
                                                                <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">{part.partNumber} • Stock: {part.quantity}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => handleAddPartToJob(part.id)}
                                                                className="bg-emerald-500 hover:bg-emerald-400 text-black p-2 rounded-xl transition-all active:scale-90"
                                                            >
                                                                <Plus size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>

                                        <div className="bg-neutral-950 rounded-3xl p-6 border border-neutral-800">
                                            <h3 className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-4">Billing Summary</h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-neutral-400 font-bold uppercase tracking-widest text-[10px]">Base Service Cost</span>
                                                    <span className="text-white font-black">₱{Number(selectedJobForBilling.estimatedCost || 0).toLocaleString()}</span>
                                                </div>
                                                {billingParts.map((p, i) => (
                                                    <div key={i} className="flex justify-between text-sm">
                                                        <span className="text-neutral-400 font-bold uppercase tracking-widest text-[10px]">{p.quantity}x {p.name}</span>
                                                        <span className="text-white font-black">₱{(p.unitprice * p.quantity).toLocaleString()}</span>
                                                    </div>
                                                ))}
                                                <div className="pt-4 mt-4 border-t border-neutral-800 flex justify-between items-center text-lg">
                                                    <span className="text-white font-black italic uppercase tracking-tighter">Subtotal</span>
                                                    <span className="text-emerald-500 font-black tracking-tighter">₱{calculateSubtotal().toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Final Adjustments */}
                                    <div className="space-y-8">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-neutral-500 uppercase tracking-widest ml-1">Discount (₱)</label>
                                                <input
                                                    type="number"
                                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-white font-black"
                                                    value={discount}
                                                    onChange={(e) => setDiscount(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-neutral-500 uppercase tracking-widest ml-1">Tax / Fees (₱)</label>
                                                <input
                                                    type="number"
                                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-white font-black"
                                                    value={tax}
                                                    onChange={(e) => setTax(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-emerald-500 p-8 rounded-[2.5rem] shadow-2xl shadow-emerald-500/20">
                                            <p className="text-black font-black uppercase tracking-widest text-xs mb-1">Final Payment Due</p>
                                            <h2 className="text-5xl font-black text-black tracking-tighter italic">
                                                ₱{(calculateSubtotal() - (parseFloat(discount) || 0) + (parseFloat(tax) || 0)).toLocaleString()}
                                            </h2>
                                            <div className="mt-8 pt-8 border-t border-black/10 flex flex-col gap-4">
                                                <button
                                                    onClick={handleCreateInvoice}
                                                    className="w-full bg-black text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl"
                                                >
                                                    <CreditCard size={18} className="text-emerald-500" />
                                                    GENERATE OFFICIAL INVOICE
                                                </button>
                                                <p className="text-black/60 font-bold uppercase tracking-widest text-[8px] text-center">This will lock the billing and notify the client</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {filteredJobs.length === 0 && !loading && (
                        <EmptyState
                            icon={AlertCircle}
                            title="No Job Orders Found"
                            message={searchTerm ? `No jobs match "${searchTerm}"` : "The workshop floor is currently clear."}
                        />
                    )}
                </div>
            )}

            {/* Create Job Modal */}
            {/* Attachments Modal */}
            {showAttachmentsModal && selectedJobForAttachments && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-white">Attachments</h2>
                                <p className="text-slate-400 text-xs mt-1">{selectedJobForAttachments.jobNumber}</p>
                            </div>
                            <button onClick={() => setShowAttachmentsModal(false)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        {/* File List */}
                        <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
                            {attachments.length > 0 ? attachments.map((file) => (
                                <div key={file.id} className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 group">
                                    <div className="p-2 bg-slate-900 rounded-lg">
                                        {file.fileType?.includes('image') ? <ImageIcon size={16} className="text-blue-500" /> : <File size={16} className="text-slate-500" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-300 truncate">{file.fileUrl.split('/').pop()}</p>
                                        <p className="text-[10px] text-slate-500">{new Date(file.uploadedAt).toLocaleString()}</p>
                                    </div>
                                    <a
                                        href={`http://localhost:5000${file.fileUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                                    >
                                        <ExternalLink size={16} />
                                    </a>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-slate-500 text-sm bg-slate-950/50 rounded-xl border border-slate-800 border-dashed">
                                    No attachments yet.
                                </div>
                            )}
                        </div>

                        {/* Upload Area */}
                        <div className="relative">
                            <label className={`block w-full border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-950/30 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                                <div className="bg-blue-500/10 text-blue-500 p-3 rounded-full w-fit mx-auto mb-3">
                                    <Upload size={24} />
                                </div>
                                <p className="text-sm font-medium text-slate-300">{uploading ? 'Uploading...' : 'Click to Upload File'}</p>
                                <p className="text-xs text-slate-500 mt-1">Images, PDF, Docs</p>
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {
                showCreateModal && (
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
                )
            }

            <ConfirmModal
                isOpen={confirmArchive.show}
                onClose={() => setConfirmArchive({ show: false, id: null })}
                onConfirm={confirmArchiveJob}
                title="Archive Job Order?"
                message="Are you sure you want to move this job to archives? It will be hidden from the main board."
                confirmLabel="Yes, Archive"
                type="warning"
            />
        </div >
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
            console.error(error);
            const msg = error.response?.data?.message || 'Error creating job';
            notify.error(msg);
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
