import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatAssistantProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hi! I\'m your SAEO Intelligence Assistant. I can answer questions about your previous audits, visibility trends, or general AEO strategies. How can I help today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}/chat/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMsg,
                    context_domain: localStorage.getItem('last_analyzed_domain') || undefined
                }),
            });

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch (error) {
            console.error('Chat failed:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I\'m having trouble connecting to my brain right now. Please try again later.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-y-0 right-0 z-50 flex items-center pointer-events-none">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="pointer-events-auto w-[400px] h-screen flex flex-col bg-slate-900/95 backdrop-blur-2xl border-l border-white/10 shadow-[-20px_0_50px_-20px_rgba(0,0,0,0.5)]"
                    >
                        {/* Header */}
                        <div className="p-6 bg-gradient-to-br from-indigo-600/20 via-transparent to-purple-600/10 border-b border-white/10 relative">
                            {/* Close Button for Sidebar */}
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 bg-indigo-500/20 rounded-2xl">
                                    <Bot className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-white tracking-tight">SAEO Co-Pilot</h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AEO Intelligence Active</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                I have access to your historical audit data and the complete SAEO.ai toolset. Ask me anything about your rankings or platform features.
                            </p>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/5">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg'
                                        : 'bg-white/5 text-slate-200 border border-white/5 rounded-tl-none shadow-inner'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/5 flex items-center gap-3">
                                        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Analyzing Context...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Actions */}
                        <div className="px-6 py-3 flex gap-2 overflow-x-auto no-scrollbar">
                            {['Show Audits', 'Explain GSC', 'AEO Tips'].map(action => (
                                <button
                                    key={action}
                                    onClick={() => {
                                        setInput(`Tell me about ${action}`);
                                    }}
                                    className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 hover:bg-white/10 hover:text-white transition-all"
                                >
                                    {action}
                                </button>
                            ))}
                        </div>

                        {/* Input */}
                        <div className="p-6 border-t border-white/10 bg-slate-900/50">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask your Co-Pilot..."
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-2xl py-3.5 pl-5 pr-14 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isLoading}
                                    className="absolute right-2 top-2 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-lg"
                                >
                                    <Send className="w-5 h-5 text-white" />
                                </button>
                            </div>
                            <div className="flex items-center justify-center gap-2 mt-4">
                                <Sparkles className="w-3 h-3 text-indigo-400" />
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                    Neural Knowledge Bridge Active
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
