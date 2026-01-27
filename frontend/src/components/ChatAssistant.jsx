import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, Calendar, ArrowRight, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ChatAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { type: 'bot', text: 'Welcome to X-ICON GARAGE! I am your virtual assistant. How can I help you optimize your ride today?' }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        // User Message
        const userMsg = { type: 'user', text: inputText };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsTyping(true);

        // Simulate AI Delay
        setTimeout(() => {
            const botResponse = generateResponse(userMsg.text);
            const formattedResponse = typeof botResponse === 'string'
                ? { type: 'bot', text: botResponse }
                : { type: 'bot', ...botResponse };
            setMessages(prev => [...prev, formattedResponse]);
            setIsTyping(false);
        }, 800);
    };

    const generateResponse = (text) => {
        const lower = text.toLowerCase();

        // Identity
        // Identity
        if (lower.includes('bins') || lower.includes('x') || (lower.includes('who') && lower.includes('you'))) {
            return "I am X, your X-ICON Assistant! I'm here to help you with booking services, tracking repairs, or finding the right parts for your machine.";
        }

        // Services - General
        if (lower.includes('service') && (lower.includes('what') || lower.includes('list') || lower.includes('offer'))) {
            return "We offer a full range of elite services: \n• Advanced Diagnostics\n• Premium Home Service\n• Precision Tuning\n• Periodic Maintenance (PMS)\n• AC Systems\n• Underchassis & Suspension";
        }

        // Specific Services
        if (lower.includes('diagnostic') || lower.includes('check') || lower.includes('scan')) {
            return "Our Advanced Diagnostics use state-of-the-art scanners to identify issues before they become expensive problems. We check engine health, sensors, and electrical systems.";
        }
        if (lower.includes('home') && lower.includes('service')) {
            return "Too busy to visit? Our Premium Home Service brings the garage to you! We perform maintenance, battery replacement, and minor repairs at your location.";
        }
        if (lower.includes('tuning') || lower.includes('performance') || lower.includes('fast')) {
            return "Unleash your engine's potential with our Precision Tuning. We optimize ECU settings, intake/exhaust flow, and suspension for ultimate control and power.";
        }
        if (lower.includes('pms') || lower.includes('maintenance') || lower.includes('change oil')) {
            return "Regular maintenance is key! Our PMS packages include high-grade synthetic oil, filter replacement, fluid checks, and a comprehensive safety inspection.";
        }

        if (lower.includes('pms') || lower.includes('maintenance') || lower.includes('change oil')) {
            return "Regular maintenance is key! Our PMS packages include high-grade synthetic oil, filter replacement, fluid checks, and a comprehensive safety inspection.";
        }

        // Troubleshooting - Expert Mode
        if (lower.includes('start') && (lower.includes('won') || lower.includes('not') || lower.includes('cant'))) {
            return "If your car won't start: \n• Clicking sound? Likely a Dead Battery. \n• Cranking but no start? Fuel or Spark issue. \n• Silent? Starter motor or ignition switch.\n\nType 'Book Battery' towards a home service!";
        }
        if (lower.includes('brake') && (lower.includes('noise') || lower.includes('squeak') || lower.includes('grind') || lower.includes('hard'))) {
            return "BRAKE WARNING: \n• Squeaking: Pads are thinning (Change soon).\n• Grinding: Metal-on-metal (CRITICAL - Do not drive).\n• Spongy Pedal: Air in lines or leak.\n\nBook a 'Brake Service' immediately for safety.";
        }
        if (lower.includes('smoke')) {
            return "Smoke Analysis:\n• White: Coolant leak (Head Gasket).\n• Blue: Burning Oil (Piston Rings).\n• Black: Rich Fuel (Sensors/Injectors).\n\nThis requires advanced diagnostics. Visit us ASAP.";
        }
        if (lower.includes('overheat') || lower.includes('temp') || lower.includes('boil')) {
            return "OVERHEATING: \n1. PULL OVER immediately.\n2. Do NOT open the radiator cap.\n3. Turn off AC, turn on Heater (helps dissipate heat).\n\nLikely: Coolant leak, stuck thermostat, or broken fan.";
        }
        if (lower.includes('sound') || lower.includes('noise')) {
            return "🔊 Sound ID:\n• Clicking (Turning): CV Axle.\n• Squealing (Startup): Loose Belt.\n• Knocking (Engine): Internal bearing damage (Stop engine!).\n• Roaring (Driving): Wheel Bearing.";
        }

        // Parts & Identification
        if (lower.includes('oil') && (lower.includes('which') || lower.includes('type') || lower.includes('best'))) {
            return "Oil Guide:\n• Modern Engines: Fully Synthetic (5W-30/5W-40) - Best protection.\n• Older Engines: Semi-Synthetic or Mineral (10W-40/20W-50).\nCheck your manual or ask us to lookup your VIN!";
        }
        if (lower.includes('battery')) {
            return "We carry Amaron & Motolite.\n• NS40: Hatchbacks\n• 1SM/2SM: Sedans\n• 3SM: SUVs/Pickups\nWe offer free battery health testing at the shop!";
        }
        if (lower.includes('vin') || lower.includes('chassis')) {
            return "The VIN is your car's fingerprint (17 chars). Found on:\n1. Dashboard (Driver Side)\n2. Driver Door Pillar\n3. Registration (OR/CR)\n\nWe need this to ensure parts fit perfectly.";
        }
        if (lower.includes('tire') || lower.includes('size')) {
            return "Reading Tires (e.g., 205/55 R16):\n• 205 = Width (mm)\n• 55 = Sidewall Height (%)\n• 16 = Rim Diameter (in)\n\nMaintain 30-35 PSI for most sedans. Check your door jamb sticker!";
        }

        // Operational
        if (lower.includes('location') || lower.includes('where') || lower.includes('address')) {
            return "We are located at Dahlia Corner Everlasting St., TS Cruz Subd, Almanza Dos, Las Piñas City. Look for the black and amber X-ICON sign!";
        }
        if (lower.includes('hour') || lower.includes('open') || lower.includes('time') || lower.includes('schedule')) {
            return "We are open Monday to Friday, from 7:00 AM to 7:00 PM. We also accept scheduled appointments on weekends.";
        }
        if (lower.includes('contact') || lower.includes('phone') || lower.includes('number') || lower.includes('email')) {
            return "You can reach us at (02) 8888-0000 or email support@x-icongarage.com. For urgent roadside assistance, use the 'Urgent' tag when booking!";
        }

        // Features
        if (lower.includes('book') || lower.includes('appointment')) {
            return "To book a service, simply click the 'BOOK SERVICE' button on the homepage or visit our Booking page. You can choose your preferred date, time, and service type.";
        }
        if (lower.includes('track') || lower.includes('status') || lower.includes('job')) {
            return "Tracking is easy! Go to the 'TRACK REPAIR' page and enter your Job Order Number (APT-xxx) and Plate Number to see real-time updates.";
        }
        if (lower.includes('part') || lower.includes('shop') || lower.includes('product')) {
            return "Looking for upgrades? Visit our 'Supreme Tools' Parts Shop to browse genuine components, oils, and performance parts available for delivery or pickup.";
        }

        // General / Small Talk
        if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
            return "Hello there! Ready to give your machine the care it deserves? Ask me about our services!";
        }
        if (lower.includes('thank') || lower.includes('thanks')) {
            return "You're welcome! Drive safe and see you at the workshop!";
        }
        if (lower.includes('price') || lower.includes('cost') || lower.includes('how much')) {
            return {
                text: "Our Basic PMS starts at ₱3,500, while Full Diagnostic Scans are ₱1,500. For complex repairs, we recommend a diagnostic check first to give you an accurate estimate.",
                actions: [{ label: 'Book Diagnostic', path: '/book', icon: <Calendar size={14} /> }]
            };
        }

        if (lower.includes('service') || lower.includes('avail') || lower.includes('what do you do')) {
            return {
                text: "We provide elite automotive solutions. Which one can I help you with today?",
                actions: [
                    { label: 'View Parts Shop', path: '/shop', icon: <ShoppingCart size={14} /> },
                    { label: 'Book an Appointment', path: '/book', icon: <Calendar size={14} /> }
                ]
            };
        }

        if (lower.includes('appointment') || lower.includes('booking') || lower.includes('reserve')) {
            return {
                text: "Setting up an appointment is fast and secure. You can choose your date and service type in our portal.",
                actions: [
                    { label: 'Start Booking Now', path: '/book', icon: <Calendar size={14} /> }
                ]
            };
        }

        return {
            text: "My diagnostics are calibrated for X-ICON operations. Please align your query with:",
            actions: [
                { label: 'Booking & Appointments', path: '/book', icon: <Calendar size={14} /> },
                { label: 'Parts & Upgrades', path: '/shop', icon: <ShoppingCart size={14} /> }
            ]
        };
    };

    return (
        <>
            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 bg-amber-500 hover:bg-amber-400 text-black p-4 rounded-full shadow-2xl shadow-amber-500/20 hover:scale-110 transition-all active:scale-95 group animate-in slide-in-from-bottom-4"
                >
                    <MessageCircle size={28} className="fill-current" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-0 right-0 md:bottom-8 md:right-8 z-50 w-full md:w-[400px] h-[100dvh] md:h-[500px] md:max-h-[80vh] bg-neutral-900 border-t md:border border-neutral-800 md:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 zoom-in-95 duration-300">
                    {/* Header */}
                    <div className="bg-neutral-950 p-4 border-b border-neutral-800 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                                <Bot size={20} className="text-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-white font-black text-sm uppercase tracking-widest">X-Icon Assistant</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Online</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 hover:bg-neutral-800 rounded-full text-neutral-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-neutral-900/50">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.type === 'user' ? 'bg-neutral-800 text-neutral-400' : 'bg-amber-500 text-black'
                                    }`}>
                                    {msg.type === 'user' ? <User size={14} /> : <Sparkles size={14} />}
                                </div>
                                <div className={`max-w-[85%] space-y-3`}>
                                    <div className={`p-3 rounded-2xl text-sm font-medium leading-relaxed ${msg.type === 'user'
                                        ? 'bg-neutral-800 text-neutral-200 rounded-tr-sm'
                                        : 'bg-neutral-950 border border-neutral-800 text-neutral-300 rounded-tl-sm'
                                        }`}>
                                        {msg.text}
                                    </div>
                                    {msg.actions && (
                                        <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-500">
                                            {msg.actions.map((action, aIdx) => (
                                                <button
                                                    key={aIdx}
                                                    onClick={() => navigate(action.path)}
                                                    className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-white/10 hover:border-amber-500/50 px-4 py-2.5 rounded-xl text-[11px] font-black text-white uppercase tracking-widest transition-all group active:scale-95 shadow-xl"
                                                >
                                                    {action.icon}
                                                    <span>{action.label}</span>
                                                    <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform text-amber-500" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-amber-500 text-black flex items-center justify-center shrink-0">
                                    <Loader2 size={14} className="animate-spin" />
                                </div>
                                <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-2xl rounded-tl-sm flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-neutral-600 rounded-full animate-bounce delay-0"></span>
                                    <span className="w-1.5 h-1.5 bg-neutral-600 rounded-full animate-bounce delay-150"></span>
                                    <span className="w-1.5 h-1.5 bg-neutral-600 rounded-full animate-bounce delay-300"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-4 bg-neutral-950 border-t border-neutral-800 shrink-0">
                        <div className="relative">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Ask about services, tracking..."
                                className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl pl-4 pr-12 py-3.5 focus:outline-none focus:border-amber-500/50 font-medium text-sm placeholder:text-neutral-600 transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!inputText.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-amber-500 text-black rounded-lg disabled:opacity-50 disabled:bg-neutral-800 disabled:text-neutral-600 transition-all hover:scale-105 active:scale-95"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                        <p className="text-[10px] text-center text-neutral-600 font-bold uppercase tracking-widest mt-3">
                            X-ICON AI Assistant • 2026
                        </p>
                    </form>
                </div>
            )}
        </>
    );
};

export default ChatAssistant;
