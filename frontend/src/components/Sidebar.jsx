import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Car,
    Wrench,
    Package,
    FileText,
    BarChart3,
    LogOut,
    CalendarCheck,
    ShoppingCart,
    ChevronLeft,
    ChevronRight,
    ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo_clean.png';
import ConfirmModal from './ConfirmModal';

const Sidebar = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const menuItems = [
        { name: 'DASHBOARD', icon: <LayoutDashboard size={18} />, path: '/dashboard', roles: ['ADMIN', 'ADVISOR', 'MECHANIC', 'ACCOUNTANT'] },
        { name: 'CUSTOMERS', icon: <Users size={18} />, path: '/dashboard/customers', roles: ['ADMIN', 'ADVISOR'] },
        { name: 'VEHICLES', icon: <Car size={18} />, path: '/dashboard/vehicles', roles: ['ADMIN', 'ADVISOR', 'MECHANIC'] },
        { name: 'JOB ORDERS', icon: <Wrench size={18} />, path: '/dashboard/job-orders', roles: ['ADMIN', 'ADVISOR', 'MECHANIC'] },
        { name: 'APPOINTMENTS', icon: <CalendarCheck size={18} />, path: '/dashboard/appointments', roles: ['ADMIN', 'ADVISOR'] },
        { name: 'WEB ORDERS', icon: <ShoppingCart size={18} />, path: '/dashboard/orders', roles: ['ADMIN', 'ADVISOR', 'ACCOUNTANT'] },
        { name: 'INVENTORY', icon: <Package size={18} />, path: '/dashboard/inventory', roles: ['ADMIN', 'ADVISOR', 'ACCOUNTANT'] },
        { name: 'INVOICES', icon: <FileText size={18} />, path: '/dashboard/invoices', roles: ['ADMIN', 'ADVISOR', 'ACCOUNTANT'] },
        { name: 'SECURITY', icon: <ShieldAlert size={18} />, path: '/dashboard/security', roles: ['ADMIN'] },
        { name: 'MY GARAGE', icon: <Wrench size={18} />, path: '/my-garage', roles: ['CUSTOMER'] },
    ];

    const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role));
    const isActive = (path) => location.pathname === path;

    const handleLogout = () => {
        logout();
        setShowLogoutConfirm(false);
        navigate('/');
    };

    return (
        <aside className={`fixed left-0 top-0 h-screen bg-neutral-950 border-r border-neutral-900 transition-all duration-500 z-50 
            ${isCollapsed ? 'w-24' : 'w-64'}
            ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
            <div className="flex flex-col h-full relative">
                {/* Brand Section */}
                <div className="p-8 border-b border-neutral-900">
                    <div className="flex items-center gap-3 group px-1">
                        <img src={logo} alt="X-Icon Garage" className="h-10 w-auto object-contain group-hover:scale-110 transition-transform duration-300" />
                        {!isCollapsed && (
                            <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-500">
                                <span className="text-lg font-black text-white tracking-tighter leading-none">X-ICON</span>
                                <span className="text-[10px] font-black tracking-widest text-amber-500/80 uppercase mt-0.5 whitespace-nowrap">GARAGE ADMIN</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-6 space-y-2 overflow-y-auto scrollbar-hide">
                    {filteredMenu.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => onClose && onClose()}
                            className={`flex items-center gap-4 px-4 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 group ${isActive(item.path)
                                ? 'bg-amber-500 text-black shadow-xl shadow-amber-500/20'
                                : 'text-neutral-500 hover:text-white hover:bg-neutral-900'
                                }`}
                        >
                            <span className={`${isActive(item.path) ? 'text-black' : 'text-amber-500/60 group-hover:text-amber-500'} transition-colors`}>
                                {item.icon}
                            </span>
                            {!isCollapsed && (
                                <span className="animate-in slide-in-from-left-2 duration-300">
                                    {item.name}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom Section */}
                <div className="p-6 border-t border-neutral-900">
                    {!isCollapsed && (
                        <div className="mb-6 px-4 py-4 bg-neutral-900/50 rounded-2xl border border-neutral-800 animate-in slide-in-from-bottom-2">
                            <p className="text-xs font-black text-neutral-500 uppercase tracking-widest leading-none">Access Controlled</p>
                            <div className="flex items-center gap-3 mt-3">
                                <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-amber-500 font-black text-xs uppercase">
                                    {user?.name?.[0]}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-white uppercase tracking-tight truncate max-w-[120px]">{user?.name}</span>
                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none mt-1">{user?.role}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-xs font-black text-neutral-500 hover:text-red-500 hover:bg-red-500/10 transition-all duration-300 uppercase tracking-widest"
                    >
                        <LogOut size={18} />
                        {!isCollapsed && <span className="animate-in fade-in duration-300">SIGN OUT</span>}
                    </button>
                </div>

                {/* Collapse Toggle - Desktop Only */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden lg:block absolute -right-3 top-24 bg-amber-500 text-black p-1.5 rounded-full border-4 border-neutral-950 hover:scale-110 transition-all shadow-xl z-50 cursor-pointer"
                >
                    {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
                </button>
            </div>

            <ConfirmModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={handleLogout}
                title="Sign Out?"
                message="You'll need to log back in to access the system."
                confirmLabel="Sign Out"
            />
        </aside>
    );
};

export default Sidebar;
