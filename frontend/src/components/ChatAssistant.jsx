import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, Calendar, ArrowRight, ShoppingCart, Clock, MapPin, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ASSISTANT_KNOWLEDGE, FALLBACK_RESPONSE } from '../data/assistantKnowledge.jsx';

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
        let bestMatch = null;
        let highestScore = 0;

        // Simple scoring based on keyword matches
        ASSISTANT_KNOWLEDGE.forEach(item => {
            let score = 0;
            item.keywords.forEach(keyword => {
                if (lower.includes(keyword.toLowerCase())) {
                    score += 1;
                }
            });

            // Boost priority items
            if (item.priority) {
                if (score > 0) score += item.priority; // Only boost if there is a match
            }

            if (score > highestScore) {
                highestScore = score;
                bestMatch = item.response;
            }
        });

        if (highestScore > 0) {
            return bestMatch;
        }

        return FALLBACK_RESPONSE;
    };

    const handleAction = (action) => {
        if (action.action === 'scroll_to_footer') {
            const footer = document.querySelector('footer');
            if (footer) {
                footer.scrollIntoView({ behavior: 'smooth' });
                // Optional: Highlight the "Contact Us" or Inquiry area
            }
            setIsOpen(false); // Close chat so they can see footer
        } else if (action.path) {
            navigate(action.path);
        }
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
                                                    onClick={() => handleAction(action)}
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
