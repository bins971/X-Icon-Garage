import React, { useState, useEffect } from 'react';
import { Plus, Package, AlertTriangle, Trash2, CheckSquare, X, Check } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import api from '../api/client';

const InventoryList = () => {
    const notify = useNotification();
    const [parts, setParts] = useState([]);
    const [showModal, setShowModal] = useState(false);

    // Multi-select Delete State
    const [deleteMode, setDeleteMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const fetchParts = async () => {
        const res = await api.get('/parts');
        setParts(res.data);
    };

    useEffect(() => { fetchParts(); }, []);

    // Selection Handlers
    const toggleSelect = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleBatchDelete = async () => {
        try {
            await Promise.all(selectedIds.map(id => api.delete(`/parts/${id}`)));
            notify.success(`Successfully removed ${selectedIds.length} items`);
            setSelectedIds([]);
            setDeleteMode(false);
            setShowDeleteConfirm(false);
            fetchParts();
        } catch (error) {
            notify.error('Failed to remove some items');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Inventory</h1>
                <div className="flex gap-3">
                    {deleteMode ? (
                        <>
                            <button
                                onClick={() => { setDeleteMode(false); setSelectedIds([]); }}
                                className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl flex items-center gap-2 font-bold uppercase tracking-wider text-xs transition-all"
                            >
                                <X size={18} /> Cancel
                            </button>
                            {selectedIds.length > 0 && (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center gap-2 font-bold uppercase tracking-wider text-xs shadow-lg shadow-red-600/20 animate-in zoom-in-50"
                                >
                                    <Trash2 size={18} /> Delete ({selectedIds.length})
                                </button>
                            )}
                        </>
                    ) : (
                        <button
                            onClick={() => setDeleteMode(true)}
                            className="px-4 py-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl flex items-center gap-2 font-bold uppercase tracking-wider text-xs transition-all"
                        >
                            <Trash2 size={18} /> Remove Items
                        </button>
                    )}

                    {!deleteMode && (
                        <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold uppercase tracking-wider text-xs shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                            <Plus size={18} /> Add Part
                        </button>
                    )}
                </div>
            </div>

            {/* Banner Guide */}
            {deleteMode && (
                <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <CheckSquare size={18} />
                    Select items below to remove.
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                {parts.map(p => {
                    const isSelected = selectedIds.includes(p.id);
                    return (
                        <div
                            key={p.id}
                            onClick={() => deleteMode && toggleSelect(p.id)}
                            className={`
                                relative p-6 rounded-2xl border transition-all duration-200 overflow-hidden
                                ${deleteMode ? 'cursor-pointer' : ''}
                                ${isSelected
                                    ? 'bg-blue-900/20 border-blue-500 shadow-xl shadow-blue-500/10 scale-[1.02]'
                                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'}
                            `}
                        >
                            {/* Selection Checkbox */}
                            {deleteMode && (
                                <div className={`absolute top-4 right-4 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-600 bg-slate-900/50'}`}>
                                    {isSelected && <Check size={14} className="text-white" />}
                                </div>
                            )}

                            {p.quantity <= p.minThreshold && !deleteMode && (
                                <div className="absolute top-0 right-0 bg-amber-500/20 text-amber-500 px-3 py-1 rounded-bl-xl text-xs font-bold flex items-center gap-1">
                                    <AlertTriangle size={12} /> LOW STOCK
                                </div>
                            )}

                            <div className="p-3 bg-slate-800 w-fit rounded-xl mb-4 overflow-hidden">
                                {p.image ? (
                                    <img src={`http://localhost:5000${p.image}`} alt={p.name} className="w-12 h-12 object-cover rounded-lg" />
                                ) : (
                                    <Package size={24} className={`transition-colors ${isSelected ? 'text-blue-400' : 'text-blue-500'}`} />
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-white">{p.name}</h3>
                            <p className="text-slate-400 text-sm">{p.partNumber}</p>
                            <div className="mt-4 flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-slate-500">Stock</p>
                                    <p className={`text-xl font-bold ${p.quantity <= p.minThreshold ? 'text-amber-500' : 'text-white'}`}>{p.quantity}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500">Selling Price</p>
                                    <p className="text-xl font-bold text-emerald-500">₱{p.sellingPrice}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modals */}
            {showModal && (
                <PartModal onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); fetchParts(); }} />
            )}

            {showDeleteConfirm && (
                <DeleteConfirmationModal
                    count={selectedIds.length}
                    onCancel={() => setShowDeleteConfirm(false)}
                    onConfirm={handleBatchDelete}
                />
            )}
        </div>
    );
};

const DeleteConfirmationModal = ({ count, onCancel, onConfirm }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trash2 size={32} className="text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Delete {count} Items?</h3>
                <p className="text-slate-400 mb-8 leading-relaxed">
                    This action cannot be undone. The selected parts will be permanently removed.
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-500/20 transition-all active:scale-95"
                    >
                        Yes, Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

const PartModal = ({ onClose, onSuccess }) => {
    const notify = useNotification();
    const [formData, setFormData] = useState({ name: '', partNumber: '', quantity: '', buyingPrice: '', sellingPrice: '', minThreshold: '' });
    const [image, setImage] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => data.append(key, formData[key]));
            if (image) data.append('image', image);

            await api.post('/parts', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            notify.success('Part added to inventory');
            onSuccess();
        } catch (error) {
            notify.error(error.response?.data?.message || 'Error adding part');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md animate-in zoom-in-95">
                <h2 className="text-xl font-bold text-white mb-6">Add New Part</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-xl cursor-pointer hover:bg-slate-800 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                {image ? (
                                    <p className="text-sm text-green-500 font-bold">{image.name}</p>
                                ) : (
                                    <>
                                        <Package className="w-8 h-8 mb-2 text-slate-500" />
                                        <p className="text-sm text-slate-500 font-bold">Click to upload image</p>
                                    </>
                                )}
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
                        </label>
                    </div>

                    <input type="text" placeholder="Part Name" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white"
                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    <input type="text" placeholder="Part Number" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white"
                        value={formData.partNumber} onChange={e => setFormData({ ...formData, partNumber: e.target.value })} />
                    <div className="grid grid-cols-2 gap-4">
                        <input type="number" placeholder="Quantity" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white"
                            value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
                        <input type="number" placeholder="Min Threshold" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white"
                            value={formData.minThreshold} onChange={e => setFormData({ ...formData, minThreshold: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="number" placeholder="Buying Price (₱)" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white"
                            value={formData.buyingPrice} onChange={e => setFormData({ ...formData, buyingPrice: e.target.value })} />
                        <input type="number" placeholder="Selling Price (₱)" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white"
                            value={formData.sellingPrice} onChange={e => setFormData({ ...formData, sellingPrice: e.target.value })} />
                    </div>

                    <div className="flex gap-4">
                        <button type="button" onClick={onClose} className="flex-1 bg-slate-800 text-white py-2 rounded-xl">Cancel</button>
                        <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-xl">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InventoryList;
