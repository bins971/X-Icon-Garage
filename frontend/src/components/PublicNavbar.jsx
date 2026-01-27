import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Wrench, ShoppingCart, Calendar, LogIn, Search, Menu, X, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo_clean.png';

const PublicNavbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    const isActive = (path) => location.pathname === path;

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Services', path: '/#services' },
        { name: 'Shop Parts', path: '/shop' },
        { name: 'Track Repair', path: '/track' },
        { name: 'Book Now', path: '/book' },
    ];

    return (
        <nav className="bg-black/90 backdrop-blur-xl border-b border-neutral-900 sticky top-0 z-50 transition-all duration-300">
            <div className="container mx-auto px-4 h-24 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-4 group">
                    <div className="relative h-14 w-auto flex items-center justify-center group-hover:scale-105 transition-all">
                        <img src={logo} alt="X-Icon Garage" className="h-14 w-auto object-contain filter drop-shadow-lg" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-2xl font-black bg-gradient-to-r from-neutral-50 via-amber-200 to-amber-500 bg-clip-text text-transparent tracking-tighter leading-none">X-ICON</span>
                        <span className="text-[10px] font-black tracking-widest text-amber-500/80 uppercase ml-0.5 mt-0.5">GARAGE</span>
                    </div>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-10">
                    {navLinks.map(link => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`text-xs font-black uppercase tracking-widest transition-all hover:text-white relative group/link ${isActive(link.path) ? 'text-amber-400' : 'text-neutral-500'
                                }`}
                        >
                            {link.name}
                            <span className={`absolute -bottom-2 left-0 h-0.5 bg-amber-500 transition-all duration-300 ${isActive(link.path) ? 'w-full' : 'w-0 group-hover/link:w-full'}`}></span>
                        </Link>
                    ))}
                </div>

                {/* Right Actions */}
                <div className="hidden md:flex items-center gap-6">
                    {user?.role === 'CUSTOMER' ? (
                        <div className="flex items-center gap-4">
                            <Link
                                to="/my-garage"
                                className={`text-[10px] font-black uppercase tracking-widest transition-all hover:text-amber-400 ${isActive('/my-garage') ? 'text-amber-500' : 'text-white'}`}
                            >
                                MY GARAGE
                            </Link>
                            <button
                                onClick={logout}
                                className="bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                            >
                                SIGN OUT
                            </button>
                        </div>
                    ) : user ? (
                        <div className="flex items-center gap-4">
                            <Link
                                to="/dashboard"
                                className="text-[10px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-400 transition-all"
                            >
                                STAFF PANEL
                            </Link>
                            <button
                                onClick={logout}
                                className="bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                            >
                                SIGN OUT
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link
                                to="/customer-login"
                                className="text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-white transition-all"
                            >
                                LOG IN
                            </Link>
                            <Link
                                to="/register"
                                className="bg-amber-500 hover:bg-amber-400 text-black px-7 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-amber-500/10 active:scale-95"
                            >
                                JOIN PORTAL
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-neutral-400 hover:text-white"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-neutral-900 border-b border-neutral-800 p-4 absolute w-full left-0 animate-in slide-in-from-top-5">
                    <div className="flex flex-col gap-4">
                        {navLinks.map(link => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`text-base font-medium py-2 ${isActive(link.path) ? 'text-amber-400' : 'text-neutral-400'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default PublicNavbar;
