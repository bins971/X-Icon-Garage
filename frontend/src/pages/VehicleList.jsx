import React, { useState, useEffect } from 'react';
import { Plus, Car } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import api from '../api/client';

const VehicleList = () => {
    const [vehicles, setVehicles] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState(null);

    const fetchVehicles = async () => {
        const res = await api.get('/vehicles');
        setVehicles(res.data);
    };

    useEffect(() => { fetchVehicles(); }, []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Vehicles</h1>
                <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all active:scale-95 font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/10">
                    <Plus size={20} /> New Vehicle
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehicles.map(v => (
                    <div key={v.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-all flex flex-col gap-4">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                                <Car size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">{v.plateNumber}</h3>
                                <p className="text-slate-400">{v.year} {v.make} {v.model}</p>
                                <p className="text-sm text-slate-500 mt-1">{v.color} • VIN: {v.vin}</p>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                            <div className="text-xs">
                                <p className="text-slate-500 uppercase font-black tracking-widest">Owner</p>
                                <p className="text-white font-bold">{v.customerName || 'N/A'}</p>
                            </div>
                            <button
                                onClick={() => setSelectedVehicle(v)}
                                className="text-blue-500 hover:text-blue-400 text-xs font-black uppercase tracking-widest"
                            >
                                Details
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <VehicleModal onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); fetchVehicles(); }} />
            )}

            {selectedVehicle && (
                <VehicleDetailsModal vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} />
            )}
        </div>
    );
};

const VehicleModal = ({ onClose, onSuccess }) => {
    const notify = useNotification();
    const [customers, setCustomers] = useState([]);
    const [formData, setFormData] = useState({
        customerId: '', vin: '', plateNumber: '', make: '', model: '', year: '', color: ''
    });

    useEffect(() => {
        api.get('/customers').then(res => setCustomers(res.data));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/vehicles', formData);
            notify.success('Vehicle registered successfully');
            onSuccess();
        } catch (error) {
            notify.error('Error creating vehicle');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md animate-in zoom-in-95">
                <h2 className="text-xl font-bold text-white mb-6">Add Vehicle</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <select required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white"
                        value={formData.customerId} onChange={e => setFormData({ ...formData, customerId: e.target.value })}>
                        <option value="">Select Owner</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="Make" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white"
                            value={formData.make} onChange={e => setFormData({ ...formData, make: e.target.value })} />
                        <input type="text" placeholder="Model" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white"
                            value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="number" placeholder="Year" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white"
                            value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} />
                        <input type="text" placeholder="Color" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white"
                            value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} />
                    </div>
                    <input type="text" placeholder="Plate Number" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white"
                        value={formData.plateNumber} onChange={e => setFormData({ ...formData, plateNumber: e.target.value })} />
                    <input type="text" placeholder="VIN" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white"
                        value={formData.vin} onChange={e => setFormData({ ...formData, vin: e.target.value })} />

                    <div className="flex gap-4">
                        <button type="button" onClick={onClose} className="flex-1 bg-slate-800 text-white py-2 rounded-xl">Cancel</button>
                        <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-lg shadow-blue-500/10">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const VehicleDetailsModal = ({ vehicle, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
            <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-10 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-amber-500 rounded-2xl shadow-xl shadow-amber-500/20">
                            <Car size={32} className="text-black" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">{vehicle.plateNumber}</h2>
                            <p className="text-amber-500 font-bold tracking-widest text-xs uppercase">{vehicle.make} {vehicle.model}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-10">
                    <div className="space-y-6">
                        <div>
                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2">Specifications</p>
                            <div className="space-y-3">
                                <p className="text-sm font-bold text-white"><span className="text-neutral-500">Year:</span> {vehicle.year}</p>
                                <p className="text-sm font-bold text-white"><span className="text-neutral-500">Color:</span> {vehicle.color}</p>
                                <p className="text-sm font-bold text-white"><span className="text-neutral-500">VIN:</span> {vehicle.vin}</p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2">Owner Information</p>
                            <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800">
                                <p className="text-sm font-black text-white uppercase">{vehicle.customerName || 'N/A'}</p>
                                <p className="text-xs text-neutral-500 mt-1 uppercase font-bold tracking-tight">Active Client</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button onClick={onClose} className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-colors">
                        Close
                    </button>
                    <button className="flex-1 bg-amber-500 hover:bg-amber-400 text-black py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-amber-500/10 transition-all active:scale-95">
                        View Service History
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VehicleList;
