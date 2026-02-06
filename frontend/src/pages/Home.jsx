import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wrench, Settings, Clock, ShieldCheck, ArrowRight, Star, PenTool, CheckCircle2, Truck, ChevronDown, ChevronUp, MapPin, Zap, Shield, HelpCircle, X, Instagram, Facebook, Twitter } from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';
import ChatAssistant from '../components/ChatAssistant';
import InquiryModal from '../components/InquiryModal';
import logo from '../assets/logo_clean.png';

const Home = () => {
    const location = useLocation();
    const [stats, setStats] = React.useState({ jobs: 0, parts: 0, vehicles: 0 });

    const [openFaq, setOpenFaq] = React.useState(null);
    const [showLegal, setShowLegal] = React.useState(null);
    const [openInquiry, setOpenInquiry] = React.useState(false);

    useEffect(() => {
        // Scroll handling
        if (location.hash) {
            const elem = document.getElementById(location.hash.replace('#', ''));
            if (elem) elem.scrollIntoView({ behavior: 'smooth' });
        }


        const baseUrl = import.meta.env.VITE_API_URL || '/api';
        fetch(`${baseUrl}/public/stats`)
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(err => console.error('Stats load failed', err));
    }, [location]);

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-200 selection:bg-amber-500/30">
            <PublicNavbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-40 overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-amber-600/10 blur-[120px] rounded-full pointer-events-none animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-900/10 blur-[100px] rounded-full pointer-events-none"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl">
                        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                            Built for Excellence. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-100 via-amber-200 to-amber-500 italic">Driven by Care.</span>
                        </h1>

                        <p className="text-xl md:text-2xl text-neutral-400 mb-8 max-w-2xl leading-relaxed font-medium animate-in fade-in slide-in-from-left-8 duration-700 delay-200">
                            At <span className="text-white font-bold">X-ICON GARAGE</span>, we don't just fix cars we engineer reliability. From performance tuning to genuine parts, experience the next level of auto care.
                        </p>

                        <div className="flex items-center gap-2 text-amber-500 font-black uppercase tracking-widest text-xs md:text-sm mb-12 animate-in fade-in slide-in-from-left-8 duration-700 delay-300">
                            <Clock size={16} />
                            <span>Open Monday - Friday • 7:00 AM - 7:00 PM</span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-5 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                            <Link to="/book" className="group bg-amber-500 hover:bg-amber-400 text-black px-10 py-5 rounded-2xl font-black text-lg transition-all shadow-2xl shadow-amber-500/20 flex items-center justify-center gap-3 active:scale-95">
                                BOOK SERVICE
                                <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link to="/track" className="bg-neutral-900/80 backdrop-blur-md hover:bg-neutral-800 text-white px-10 py-5 rounded-2xl font-black text-lg transition-all border border-neutral-800 flex items-center justify-center gap-3 active:scale-95">
                                <Clock size={22} className="text-amber-500" /> TRACK REPAIR
                            </Link>
                        </div>
                    </div>
                </div>
            </section>


            {/* Services Redesigned */}
            <section className="py-32 relative" id="services">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-xl mb-20">
                        <h2 className="text-sm font-black text-amber-500 uppercase tracking-widest mb-4">Reliable Performance</h2>
                        <h3 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">TAILORED SOLUTIONS FOR EVERY DRIVE</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                icon: <Settings size={32} />,
                                color: 'text-amber-400',
                                glow: 'group-hover:shadow-amber-500/20',
                                title: 'ADVANCED DIAGNOSTICS',
                                desc: 'State of the art diagnostic tools to identify issues before they become expensive problems.'
                            },
                            {
                                icon: <Truck size={32} />,
                                color: 'text-orange-400',
                                glow: 'group-hover:shadow-orange-500/20',
                                title: 'PREMIUM HOME SERVICE',
                                desc: 'We bring the garage to you. Professional maintenance and repairs at the comfort of your home.'
                            },
                            {
                                icon: <Wrench size={32} />,
                                color: 'text-emerald-400',
                                glow: 'group-hover:shadow-emerald-500/20',
                                title: 'PRECISION TUNING',
                                desc: 'Optimization of engine performance, suspension, and braking systems for ultimate control.'
                            },
                            {
                                icon: <PenTool size={32} />,
                                color: 'text-blue-400',
                                glow: 'group-hover:shadow-blue-500/20',
                                title: 'GENUINE PARTS SHOP',
                                desc: 'Browse and order factory grade parts directly from our inventory for guaranteed longevity.'
                            }
                        ].map((feature, i) => (
                            <div key={i} className={`group bg-neutral-900/40 backdrop-blur-xl border border-neutral-800 p-10 rounded-[2.5rem] hover:border-neutral-700 transition-all duration-500 hover:-translate-y-3 ${feature.glow} shadow-2xl`}>
                                <div className={`w-16 h-16 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center mb-8 transition-all duration-500 group-hover:scale-110 group-hover:border-neutral-700 ${feature.color}`}>
                                    {feature.icon}
                                </div>
                                <h4 className="text-xl font-black text-white mb-4 tracking-tight uppercase tracking-widest">{feature.title}</h4>
                                <p className="text-neutral-400 leading-relaxed font-medium">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Performance Packages Section */}
            <section className="py-32 bg-neutral-950/50 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-20">
                        <h2 className="text-sm font-black text-amber-500 uppercase tracking-widest mb-4">Supreme Upgrades</h2>
                        <h3 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none italic uppercase">PERFORMANCE PACKAGES</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {[
                            {
                                name: 'STAGE 1 INTAKE',
                                price: '₱12,500',
                                features: ['High-flow Air Filter', 'ECU Calibration', 'Dyno Testing', 'Installation'],
                                icon: <Zap size={24} />,
                                color: 'from-amber-500 to-orange-600'
                            },
                            {
                                name: 'PRECISION DETAILING',
                                price: '₱8,000',
                                features: ['Ceramic Coating', 'Interior Deep Clean', 'Paint Correction', 'Engine Bay Wash'],
                                icon: <ShieldCheck size={24} />,
                                color: 'from-blue-500 to-indigo-600',
                                featured: true
                            },
                            {
                                name: 'ELITE SERVICE',
                                price: '₱5,500',
                                features: ['Genuine Oil Filter', 'Synthetic Oil Spark', '32-Point Check', 'Brake Cleaning'],
                                icon: <Settings size={24} />,
                                color: 'from-emerald-500 to-teal-600'
                            }
                        ].map((pkg, i) => (
                            <div key={i} className={`relative group bg-neutral-900 border ${pkg.featured ? 'border-amber-500/50' : 'border-neutral-800'} p-10 rounded-[3rem] transition-all duration-500 hover:-translate-y-4 hover:border-neutral-700 shadow-2xl`}>
                                {pkg.featured && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-xs font-black px-6 py-2 rounded-full tracking-widest uppercase">Most Popular</div>
                                )}
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${pkg.color} flex items-center justify-center mb-8 text-black shadow-xl shadow-amber-500/10`}>
                                    {pkg.icon}
                                </div>
                                <h4 className="text-2xl font-black text-white mb-2 leading-tight uppercase tracking-tight italic">{pkg.name}</h4>
                                <p className="text-4xl font-black text-amber-500 mb-8 font-mono">{pkg.price}</p>
                                <ul className="space-y-4 mb-10">
                                    {pkg.features.map((f, idx) => (
                                        <li key={idx} className="flex items-center gap-3 text-sm text-neutral-400 font-bold uppercase tracking-wider">
                                            <CheckCircle2 size={16} className="text-neutral-600" /> {f}
                                        </li>
                                    ))}
                                </ul>
                                <Link to="/book" className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${pkg.featured ? 'bg-amber-500 text-black' : 'bg-neutral-800 text-white hover:bg-neutral-700'}`}>
                                    CONFIGURE <ArrowRight size={14} />
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Elite CTA */}
            <section className="py-32">
                <div className="container mx-auto px-4">
                    <div className="relative bg-neutral-900 rounded-[3rem] p-12 md:p-24 overflow-hidden border border-neutral-800 group">
                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-amber-600/5 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/10 blur-[100px] rounded-full"></div>

                        <div className="relative z-10 max-w-3xl mx-auto text-center">
                            <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter uppercase italic leading-none">
                                Ready to <span className="text-amber-500 underline decoration-amber-500/30 underline-offset-8">IGNITE</span> <br />
                                YOUR RIDE?
                            </h2>
                            <p className="text-xl text-neutral-400 mb-12 font-medium">
                                Join thousands of satisfied drivers who trust <span className="text-white">X-ICON GARAGE</span> for their premium auto needs.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-5">
                                <Link to="/shop" className="bg-white text-black px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-neutral-200 transition-all active:scale-95 shadow-2xl">
                                    BROWSE SHOP
                                </Link>
                                <Link to="/book" className="bg-amber-600 text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-amber-500 transition-all active:scale-95 shadow-2xl shadow-amber-600/20">
                                    SCHEDULE NOW
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-32 bg-neutral-950">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-20">
                            <HelpCircle size={48} className="text-amber-500 mx-auto mb-6" />
                            <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter italic uppercase">FREQUENTLY ASKED QUESTIONS</h3>
                            <p className="text-neutral-500 font-bold uppercase tracking-widest mt-4">Everything you need to know about our elite service</p>
                        </div>

                        <div className="space-y-4">
                            {[
                                { q: 'What kind of cars do you specialize in?', a: 'We specialize in performance European and Japanese machines, but our workshop is equipped to handle elite care for all supreme machines regardless of their origin.' },
                                { q: 'How long does a Stage 1 tune take?', a: 'A standard Stage 1 package typically takes 4-6 hours, including pre-installation diagnostics, installation, and rigorous dyno testing to ensure optimal reliability.' },
                                { q: 'Do you offer home pick-up and delivery?', a: 'Yes! Our Premium Home Service allows for on-site maintenance, and we also offer secure pick-up and delivery for major workshop repairs within the city.' },
                                { q: 'Are your parts factory certified?', a: 'We use 100% genuine and factory-grade parts. All parts from our X-ICON Shop come with a guaranteed longevity warranty for your peace of mind.' }
                            ].map((faq, i) => (
                                <div key={i} className="border border-neutral-900 bg-neutral-900/40 rounded-3xl overflow-hidden transition-all duration-300">
                                    <button
                                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                        className="w-full px-8 py-8 flex items-center justify-between text-left group"
                                    >
                                        <span className={`text-lg font-black uppercase tracking-tight transition-colors ${openFaq === i ? 'text-amber-500' : 'text-white'}`}>{faq.q}</span>
                                        <div className={`transition-transform duration-300 ${openFaq === i ? 'rotate-180 text-amber-500' : 'text-neutral-600'}`}>
                                            <ChevronDown size={24} />
                                        </div>
                                    </button>
                                    <div className={`transition-all duration-500 overflow-hidden ${openFaq === i ? 'max-h-96' : 'max-h-0'}`}>
                                        <p className="px-8 pb-8 text-neutral-400 font-medium leading-relaxed">
                                            {faq.a}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Map Section */}
            <section className="py-20 bg-neutral-950">
                <div className="container mx-auto px-4">
                    <div className="relative h-[400px] w-full bg-neutral-900 rounded-[3rem] overflow-hidden border border-neutral-800 shadow-2xl">
                        <iframe
                            title="X-ICON GARAGE Location"
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3863.6300431320395!2d121.0152433!3d14.448496!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397d10000000001%3A0x0!2sDahlia+Corner+Everlasting+St,+Las+Pi%C3%B1as+City!5e0!3m2!1sen!2sph!4v1716400000000"
                            width="100%"
                            height="100%"
                            style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' }}
                            allowFullScreen=""
                        ></iframe>
                        <div className="absolute bottom-6 left-6 bg-neutral-950/90 backdrop-blur-xl border border-neutral-800 p-6 rounded-3xl shadow-2xl max-w-[280px] animate-in fade-in slide-in-from-left-4 duration-700 hidden md:block">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="bg-amber-500 p-2 rounded-xl shrink-0">
                                    <MapPin size={18} className="text-black" />
                                </div>
                                <div>
                                    <h4 className="text-white font-black text-xs uppercase tracking-widest">VISIT US</h4>
                                    <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest">Open 24/7</p>
                                </div>
                            </div>
                            <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider leading-relaxed">
                                DAHLIA CORNER EVERLASTING ST.<br />
                                LAS PIÑAS CITY
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-neutral-950 border-t border-neutral-900 py-12 transition-all">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-16 items-start">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="flex items-center gap-3">
                                <img src={logo} alt="X-Icon Garage" className="h-12 w-auto object-contain" />
                                <span className="text-3xl font-black text-white tracking-tighter uppercase italic">X-ICON <span className="text-amber-500">GARAGE</span></span>
                            </div>
                            <p className="text-neutral-500 text-sm leading-relaxed max-w-sm font-bold uppercase tracking-widest">
                                DAHLIA CORNER EVERLASTING ST. TS CRUZ SUBD,<br />
                                ALMANZA DOS, LAS PIÑAS CITY
                            </p>
                            <div className="flex items-center gap-2 text-amber-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span className="text-sm font-black tracking-wider">0968 224 8734</span>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <a
                                    href="https://www.facebook.com/profile.php?id=61585965067769"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-center text-neutral-500 hover:text-amber-500 hover:border-amber-500/50 transition-all active:scale-90"
                                >
                                    <Facebook size={18} />
                                </a>
                            </div>
                        </div>

                        {/* Links Section */}
                        <div className="grid grid-cols-2 lg:col-span-2 gap-12">
                            <div className="space-y-6">
                                <h5 className="text-white font-black text-xs uppercase tracking-[0.3em] opacity-40">PLATFORM</h5>
                                <ul className="space-y-4">
                                    <li><Link to="/shop" className="text-neutral-400 hover:text-amber-500 transition-colors text-sm font-bold uppercase tracking-widest block">Parts Store</Link></li>
                                    <li><Link to="/track" className="text-neutral-400 hover:text-amber-500 transition-colors text-sm font-bold uppercase tracking-widest block">Track Job</Link></li>
                                    <li><Link to="/book" className="text-neutral-400 hover:text-amber-500 transition-colors text-sm font-bold uppercase tracking-widest block">Booking</Link></li>
                                </ul>
                            </div>
                            <div className="space-y-6">
                                <h5 className="text-white font-black text-xs uppercase tracking-[0.3em] opacity-40">COMPANY</h5>
                                <ul className="space-y-4">
                                    <li><Link to="/login" className="text-neutral-400 hover:text-amber-500 transition-colors text-sm font-bold uppercase tracking-widest block">Admin Portal</Link></li>
                                    <li><button onClick={() => setOpenInquiry(true)} className="text-neutral-400 hover:text-amber-500 transition-colors text-sm font-bold uppercase tracking-widest block text-left">Contact Us</button></li>
                                    <li><button onClick={() => setShowLegal('TERMS')} className="text-neutral-400 hover:text-amber-500 transition-colors text-sm font-bold uppercase tracking-widest block text-left">Terms of Service</button></li>
                                    <li><button onClick={() => setShowLegal('PRIVACY')} className="text-neutral-400 hover:text-amber-500 transition-colors text-sm font-bold uppercase tracking-widest block text-left">Privacy Policy</button></li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 pt-10 border-t border-neutral-900 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-neutral-600 text-[10px] font-black uppercase tracking-[0.2em]">&copy; 2026 X-ICON GARAGE. ALL RIGHTS RESERVED.</p>
                        <div className="flex gap-8 text-neutral-700 text-[10px] font-black uppercase tracking-[0.2em]">
                            <span className="flex items-center gap-2"><Shield size={12} /> SECURE GATEWAY</span>
                            <span className="flex items-center gap-2"><Zap size={12} /> HIGH PERFORMANCE</span>
                        </div>
                    </div>
                </div>

                {/* Legal Modal */}
                {showLegal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowLegal(null)}></div>
                        <div className="relative bg-neutral-900 border border-neutral-800 w-full max-w-2xl max-h-full overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
                            <div className="p-8 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50 backdrop-blur-md sticky top-0 z-10">
                                <h2 className="text-xl font-black text-white italic tracking-tight uppercase italic">
                                    {showLegal === 'TERMS' ? 'TERMS OF SERVICE' : 'PRIVACY POLICY'}
                                </h2>
                                <button onClick={() => setShowLegal(null)} className="text-neutral-500 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-8 overflow-y-auto custom-scrollbar">
                                <div className="prose prose-invert prose-neutral max-w-none text-neutral-400 font-medium">
                                    {showLegal === 'TERMS' ? (
                                        <div className="space-y-6">
                                            <p className="text-amber-500 font-black uppercase tracking-widest text-xs">Standard Operating Procedure - Elite Tier</p>
                                            <p>Welcome to X-ICON GARAGE. By accessing our platform, you agree to adhere to our mechanical and safety standards.</p>
                                            <h3 className="text-white font-bold uppercase tracking-widest text-sm">1. Service Protocols</h3>
                                            <p>All job orders are subject to technical appraisal. We reserve the right to prioritize performance builds for Supreme Tier members.</p>
                                            <h3 className="text-white font-bold uppercase tracking-widest text-sm">2. Safety Compliance</h3>
                                            <p>Customers must strictly follow workshop safety zones when present on-site. Unauthorized access to precision tools is strictly prohibited.</p>
                                            <h3 className="text-white font-bold uppercase tracking-widest text-sm">3. Maintenance Execution</h3>
                                            <p>We provide a 30-day performance guarantee on all labor. Parts are subject to manufacturer warranty terms.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <p className="text-amber-500 font-black uppercase tracking-widest text-xs">Data Security Protocol - X-ICON SECURE</p>
                                            <p>Your machine's data is your property. We protect your logs with enterprise-grade encryption.</p>
                                            <h3 className="text-white font-bold uppercase tracking-widest text-sm">1. Information Collection</h3>
                                            <p>We collect VIN, plate numbers, and mechanical logs purely for service tracking and performance optimization.</p>
                                            <h3 className="text-white font-bold uppercase tracking-widest text-sm">2. Data Usage</h3>
                                            <p>Your data is never traded. It is used exclusively to streamline your workshop experience and notification flow.</p>
                                            <h3 className="text-white font-bold uppercase tracking-widest text-sm">3. Portal Security</h3>
                                            <p>Our customer portal uses end-to-end encryption for all password and session data.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="p-8 border-t border-neutral-800 bg-neutral-950/50 text-center">
                                <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">X-ICON GARAGE SECURITY COMPLIANT • 2026</p>
                            </div>
                        </div>
                    </div>
                )}
            </footer>
            <ChatAssistant />

            <InquiryModal
                isOpen={openInquiry}
                onClose={() => setOpenInquiry(false)}
            />
        </div>
    );
};

export default Home;
