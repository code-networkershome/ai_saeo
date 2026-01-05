import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Search,
    Shield,
    FileText,
    Users,
    Settings,
    LogOut,
    Cpu,
    BarChart3,
    Activity,
    Sparkles,
    Bot
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
    onToggleChat?: () => void;
    isChatOpen?: boolean;
}

export const Sidebar = ({ onToggleChat, isChatOpen }: SidebarProps) => {
    const { signOut } = useAuth();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Overview', path: '/dashboard', color: 'text-blue-500' },
        { icon: Shield, label: 'SEO Audit', path: '/dashboard/audit', color: 'text-purple-500' },
        { icon: BarChart3, label: 'Web Analytics', path: '/dashboard/analytics', color: 'text-green-500' },
        { icon: Activity, label: 'AI Visibility', path: '/dashboard/aeo', color: 'text-orange-500' },
        { icon: Search, label: 'Keywords', path: '/dashboard/keywords', color: 'text-pink-500' },
        { icon: FileText, label: 'Content Lab', path: '/dashboard/content', color: 'text-cyan-500' },
        { icon: Users, label: 'Competitors', path: '/dashboard/competitors', color: 'text-indigo-500' },
    ];

    return (
        <aside className="w-64 bg-card border-r border-border h-screen sticky top-0 flex flex-col z-50 transition-all duration-300">
            <div className="p-6 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                    <Cpu className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-sm font-black tracking-tighter uppercase">SAEO<span className="text-primary italic">.AI</span></h1>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">Autonomous Engine</p>
                </div>
            </div>

            <div className="flex-1 px-4 py-4 overflow-y-auto custom-scrollbar">
                <nav className="space-y-1">
                    {menuItems.map((item) => (
                        <NavLink
                            to={item.path}
                            key={item.path}
                            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group ${isActive ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
                        >
                            <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${item.color}`} />
                            <span className="text-xs font-bold tracking-tight">{item.label}</span>

                            {/* Hover Indicator */}
                            <div className={`ml-auto w-1 h-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity`} />
                        </NavLink>
                    ))}

                    {/* AI Co-Pilot Toggle */}
                    <button
                        onClick={onToggleChat}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group ${isChatOpen ? 'bg-indigo-500/10 text-indigo-500 shadow-sm' : 'text-muted-foreground hover:bg-indigo-500/5 hover:text-indigo-400'}`}
                    >
                        <Bot className={`w-5 h-5 transition-transform group-hover:scale-110 ${isChatOpen ? 'text-indigo-500' : 'text-indigo-400'}`} />
                        <span className="text-xs font-bold tracking-tight">AI Co-Pilot</span>
                        <div className={`ml-auto w-1 h-1 rounded-full bg-indigo-500 ${isChatOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`} />
                    </button>
                </nav>

                {/* Pro Status Upgrade Card */}
                <div className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent border border-primary/20 relative overflow-hidden group cursor-pointer">
                    <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:scale-125 transition-transform">
                        <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <h4 className="text-[10px] font-black uppercase text-primary mb-1">Compute Level</h4>
                    <p className="text-[11px] font-bold mb-3">Enterprise Agentic Cloud</p>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div className="h-full w-4/5 bg-primary animate-pulse" />
                    </div>
                </div>
            </div>

            <div className="p-4 flex flex-col space-y-2 border-t border-border bg-secondary/10">
                <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-all group">
                    <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Parameters</span>
                </button>
                <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-500 hover:bg-red-500/10 transition-all group"
                >
                    <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Terminate</span>
                </button>
            </div>
        </aside>
    );
};
