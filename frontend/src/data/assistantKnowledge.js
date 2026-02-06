
import { Calendar, ShoppingCart, MapPin, Truck, Wrench, ShieldCheck, Mail, Phone, Zap, Clock } from 'lucide-react';
import React from 'react';

export const ASSISTANT_KNOWLEDGE = [
    // Identity
    {
        keywords: ['identity', 'bot', 'name', 'assistant', 'who are you'],
        response: "I am X, your X-ICON Assistant! I'm here to help you with booking services, tracking repairs, parts inquiries, or finding the right upgrades for your machine."
    },

    // Location & Contact
    {
        keywords: ['location', 'address', 'located', 'map', 'directions', 'where'],
        response: {
            text: "We are located at Dahlia Corner Everlasting St., TS Cruz Subd, Almanza Dos, Las Piñas City. Look for the black and amber X-ICON sign!",
            actions: [
                { label: 'View Map', path: '/#map', icon: <MapPin size={14} /> }
            ]
        }
    },
    {
        keywords: ['contact', 'phone', 'number', 'email', 'call', 'reach', 'support'],
        response: "You can reach us at (02) 8888-0000 or 0968 224 8734. Email us at support@x-icongarage.com. For urgent roadside assistance, please call immediately.",
        priority: 10
    },
    {
        keywords: ['hour', 'open', 'close', 'schedule', 'time', 'availability', 'days'],
        response: "We are open Monday to Friday, from 7:00 AM to 7:00 PM. We also accept scheduled appointments on weekends."
    },

    // Services - General
    {
        keywords: ['service', 'offer', 'list', 'capabilities'],
        response: {
            text: "We offer elite automotive services including Advanced Diagnostics, Premium Home Service, Precision Tuning, PMS (Periodic Maintenance), AC Systems, and Underchassis Repair.",
            actions: [
                { label: 'Book Service', path: '/book', icon: <Calendar size={14} /> }
            ]
        }
    },

    // Services - Specific
    {
        keywords: ['diagnostic', 'scan', 'check', 'computer', 'error', 'light'],
        response: "Our Advanced Diagnostics use state-of-the-art scanners to identify hidden issues in engine health, sensors, and electrical systems before they become expensive problems.",
        priority: 5
    },
    {
        keywords: ['home', 'house', 'remote', 'visit', 'pickup', 'deliver'],
        response: "Too busy? Our Premium Home Service brings the garage to you! We perform maintenance, battery replacement, and minor repairs at your location. We also offer pick-up and delivery.",
        priority: 5
    },
    {
        keywords: ['tuning', 'performance', 'power', 'speed', 'ecu', 'remap', 'stage'],
        response: "Unleash your engine's potential with our Precision Tuning. We optimize ECU settings, intake/exhaust flow, and suspension for ultimate control and power.",
        priority: 5
    },
    {
        keywords: ['pms', 'maintenance', 'oil', 'change', 'fluid', 'filter', 'tune up'],
        response: "Regular maintenance is key! Our PMS packages include high-grade synthetic oil (Motul/Mobil 1), filter replacement, fluid checks, and a comprehensive safety inspection.",
        priority: 5
    },
    {
        keywords: ['aircon', 'ac', 'cooling', 'cool', 'freon'],
        response: "Stay cool! We offer complete AC system services, including cleaning, freon recharging, leak testing, and compressor repair."
    },
    {
        keywords: ['underchassis', 'suspension', 'shock', 'strut', 'bushing', 'kalampag'],
        response: "Hear a noise? Our Underchassis & Suspension services fix 'kalampag', improve ride comfort, and ensure vehicle stability."
    },

    // Booking & Features
    {
        keywords: ['book', 'appointment', 'reserve', 'date'],
        response: {
            text: "To book a service, simply click the 'BOOK SERVICE' button. You can choose your preferred date, time, and service type online.",
            actions: [
                { label: 'Book Now', path: '/book', icon: <Calendar size={14} /> }
            ]
        }
    },
    {
        keywords: ['track', 'status', 'job', 'repair', 'update', 'progress'],
        response: {
            text: "Tracking is easy! Enter your Job Order Number (APT-xxx) and Plate Number on our Tracking page to see real-time updates.",
            actions: [
                { label: 'Track Job', path: '/track', icon: <Clock size={14} /> }
            ]
        }
    },
    {
        keywords: ['shop', 'part', 'buy', 'product', 'store', 'inventory', 'stock'],
        response: {
            text: "Looking for upgrades? Visit our 'Supreme Tools' Parts Shop to browse genuine components, oils, and performance parts available for delivery or pickup.",
            actions: [
                { label: 'Browse Shop', path: '/shop', icon: <ShoppingCart size={14} /> }
            ]
        }
    },

    // Payment
    {
        keywords: ['pay', 'payment', 'cash', 'card', 'gcash', 'maya', 'bank'],
        response: "We accept Cash, GCash, PayMaya, and Bank Transfer (BDO). For parts, we offer a manual secure checkout process."
    },

    // Policy & Warranty
    {
        keywords: ['warranty', 'guarantee', 'policy', 'return', 'refund'],
        response: "We provide a 30-day performance guarantee on all labor. Parts are subject to manufacturer warranty terms. We stand by our work!"
    },
    {
        keywords: ['safety', 'rule', 'shop', 'visit'],
        response: "For your safety, please strictly follow workshop safety zones when on-site. Unauthorized access to precision tools is prohibited."
    },

    // Troubleshooting / Expert Tips (Restored/Refined)
    {
        keywords: ['start', 'wont', 'crank', 'dead'],
        response: "If your car won't start: \n• Clicking? Likely Dead Battery. \n• Cranking but no start? Fuel/Spark issue. \n• Silent? Starter/Ignition.\n\nWe can send a mechanic!"
    },
    {
        keywords: ['brake', 'squeak', 'grind', 'noise', 'stop'],
        response: "Brake Warning: \n• Squeaking: Pads thinning. \n• Grinding: Metal-on-metal (CRITICAL). \n• Spongy: Air in lines.\n\nBook a brake service immediately for safety."
    },
    {
        keywords: ['overheat', 'temp', 'hot', 'smoke'],
        response: "OVERHEATING: \n1. PULL OVER immediately.\n2. Do NOT open the radiator cap.\n3. Turn off AC, turn on Heater.\nLikely coolant leak or fan failure."
    },
    {
        keywords: ['tire', 'pressure', 'psi', 'size'],
        response: "For most sedans, maintain 30-35 PSI. Check your driver's door jamb for the specific manufacturer recommendation for your vehicle."
    },
    {
        keywords: ['oil type', 'synthetic', 'mineral'],
        response: "We recommend Fully Synthetic (5W-30/5W-40) for modern engines for best protection. For older engines, Semi-Synthetic or Mineral (10W-40/20W-50) works well."
    },

    // Small Talk
    {
        keywords: ['hello', 'hi', 'hey', 'greetings'],
        response: "Hello there! Ready to give your machine the care it deserves? Ask me about our services!"
    },
    {
        keywords: ['thank', 'thanks', 'cool', 'great', 'awesome'],
        response: "You're welcome! Drive safe and see you at the workshop!"
    },
    {
        keywords: ['bye', 'goodbye', 'see you'],
        response: "Safe travels! Remember, we're here whenever your car needs us."
    }
];

export const FALLBACK_RESPONSE = {
    text: "I'm not sure about that specific detail. For more complex inquiries, please ask directly using our Inquiry form below.",
    actions: [
        { label: 'Ask Us Directly', action: 'scroll_to_footer', icon: <Mail size={14} /> }
    ]
};
