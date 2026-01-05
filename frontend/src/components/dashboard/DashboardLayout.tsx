import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Bell, Search, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeToggle } from '../ui/ThemeToggle';
import { ChatAssistant } from './ChatAssistant';

export const DashboardLayout = () => {
    const { user } = useAuth();
    const [isChatOpen, setIsChatOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
            {/* Unified Sidebar */}
            <Sidebar onToggleChat={() => setIsChatOpen(!isChatOpen)} isChatOpen={isChatOpen} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#fdfdfd] dark:bg-background relative">
                {/* Top Header */}
                <header className="h-16 border-b border-border/40 bg-card/10 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-40">
                    <div className="flex items-center flex-1 max-w-xl">
                        <div className="relative w-full group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Search queries, domains, or audit reports..."
                                className="w-full bg-secondary/20 border border-transparent rounded-2xl py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:bg-background focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-medium"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-border bg-background/50 text-[9px] font-bold text-muted-foreground">
                                ⌘ K
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-6">
                        <div className="hidden sm:flex items-center space-x-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Real-time Analysis Active</span>
                        </div>

                        <div className="flex items-center space-x-2">
                            <ThemeToggle />
                            <button className="relative p-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-xl transition-all">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-background" />
                            </button>
                        </div>

                        <div className="flex items-center space-x-4 pl-4 border-l border-border/50">
                            <div className="flex flex-col items-end hidden lg:flex">
                                <p className="text-xs font-black tracking-tight">{user?.email?.split('@')[0]}</p>
                                <div className="flex items-center space-x-1">
                                    <Sparkles className="w-2.5 h-2.5 text-primary" />
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Premium Entity</p>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 p-[2px] shadow-lg shadow-primary/20 group cursor-pointer overflow-hidden">
                                <div className="w-full h-full rounded-[14px] bg-background flex items-center justify-center font-black text-transparent bg-clip-text bg-gradient-to-br from-primary to-purple-500 text-sm group-hover:scale-110 transition-transform">
                                    {user?.email?.charAt(0).toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    <div className="max-w-7xl mx-auto pb-20">
                        <Outlet />
                    </div>
                </main>

                {/* Chat Assistant */}
                <ChatAssistant isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

                {/* Footer Status Bar */}
                <footer className="h-10 border-t border-border/40 bg-card/10 backdrop-blur-md px-6 flex items-center justify-between text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <span>System Healthy</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <span>GSC Connected</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span>API v2.4.0</span>
                        <span>Node: SAEO-Mumbai-01</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};
