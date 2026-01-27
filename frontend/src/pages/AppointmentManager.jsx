import { Calendar, CheckCircle, XCircle, Clock, AlertCircle, Trash2, Filter } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import api from '../api/client';
import ConfirmModal from '../components/ConfirmModal';

const AppointmentManager = () => {
    const notify = useNotification();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmAction, setConfirmAction] = useState({ show: false, id: null, type: 'delete' });

    const fetchAppointments = async () => {
        try {
            const res = await api.get('/bookings');
            setAppointments(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAppointments(); }, []);

    const updateStatus = async (id, status) => {
        try {
            await api.patch(`/bookings/${id}`, { status });
            notify.success(`Appointment marked as ${status.toLowerCase()}`);
            fetchAppointments();
        } catch (error) {
            notify.error('Failed to update appointment status');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/bookings/${id}`);
            notify.success('Appointment removed');
            fetchAppointments();
        } catch (error) {
            notify.error('Failed to delete appointment');
        }
    };

    const handlePurge = async () => {
        try {
            const res = await api.delete('/bookings/purge');
            notify.success(res.data.message);
            fetchAppointments();
        } catch (error) {
            notify.error('Failed to purge appointments');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tighter uppercase italic">Appointment Requests</h1>
                    <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs mt-1">Manage service bookings and scheduling</p>
                </div>
                <button
                    onClick={() => setConfirmAction({ show: true, id: 'all', type: 'purge' })}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-red-500/10 hover:text-red-500 text-neutral-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                    <Trash2 size={16} /> Purge Inactive
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {appointments.map(appt => (
                    <div key={appt.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex justify-between items-start group hover:border-slate-700 transition-all">
                        <div className="flex gap-4">
                            <div className="p-3 bg-slate-800 rounded-xl h-fit text-blue-400">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">{appt.customerName}</h3>
                                <p className="text-slate-400 text-sm flex items-center gap-2">
                                    <Clock size={14} />
                                    {new Date(appt.date).toLocaleString()}
                                </p>
                                <div className="mt-3 flex items-center gap-4 text-sm">
                                    <span className="bg-slate-800 px-3 py-1 rounded-full text-slate-300 border border-slate-700">{appt.serviceType}</span>
                                    <span className="text-slate-500">{appt.phone}</span>
                                </div>
                                {appt.notes && (
                                    <p className="mt-3 text-sm text-slate-500 italic">"{appt.notes}"</p>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                            <StatusBadge status={appt.status} />

                            {appt.status === 'PENDING' && (
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => updateStatus(appt.id, 'CONFIRMED')}
                                        className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg transition-colors"
                                        title="Confirm"
                                    >
                                        <CheckCircle size={20} />
                                    </button>
                                    <button
                                        onClick={() => updateStatus(appt.id, 'CANCELLED')}
                                        className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                                        title="Cancel"
                                    >
                                        <XCircle size={20} />
                                    </button>
                                </div>
                            )}

                            {appt.status !== 'PENDING' && (
                                <button
                                    onClick={() => setConfirmAction({ show: true, id: appt.id, type: 'delete' })}
                                    className="p-2 text-neutral-600 hover:text-red-500 transition-colors"
                                    title="Delete Record"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}

                            {appt.status === 'CONFIRMED' && (
                                <button
                                    onClick={() => updateStatus(appt.id, 'COMPLETED')}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-colors"
                                >
                                    Mark Completed
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {appointments.length === 0 && !loading && (
                    <div className="text-center py-12 text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                        No appointments found.
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={confirmAction.show}
                onClose={() => setConfirmAction({ show: false, id: null, type: 'delete' })}
                onConfirm={confirmAction.type === 'purge' ? handlePurge : () => handleDelete(confirmAction.id)}
                title={confirmAction.type === 'purge' ? "Purge Inactive?" : "Delete Appointment?"}
                message={confirmAction.type === 'purge'
                    ? "This will permanently remove all CANCELLED and COMPLETED appointments from the database."
                    : "Are you sure you want to remove this appointment record?"}
                confirmLabel={confirmAction.type === 'purge' ? "Yes, Purge All" : "Yes, Delete"}
            />
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const styles = {
        PENDING: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        CONFIRMED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        CANCELLED: 'bg-red-500/10 text-red-500 border-red-500/20',
        COMPLETED: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || styles.PENDING}`}>
            {status}
        </span>
    );
};

export default AppointmentManager;
