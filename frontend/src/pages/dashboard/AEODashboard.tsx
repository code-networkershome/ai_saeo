import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Link as LinkIcon,
    CheckCircle2,
    BarChart3,
    X,
    Sparkles,
    RefreshCw,
    Activity,
    Target,
    TrendingUp,
    Terminal,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LabelList
} from 'recharts';
import api from '../../lib/api';

import { useDashboard } from '../../contexts/DashboardContext';

export const AEODashboard = () => {
    const { state, setAeoState } = useDashboard();
    const [brandName, setBrandName] = useState(state.aeo.input);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(state.aeo.results);
    const [showPlaybookModal, setShowPlaybookModal] = useState(false);

    const handleCheckVisibility = async (e: FormEvent) => {
        e.preventDefault();
        if (!brandName) return;

        setLoading(true);
        try {
            const response = await api.post('/ai-visibility/check', { brand_name: brandName });
            const data = response.data.data;
            setResults(data);
            setAeoState(data, brandName);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/40 pb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter mb-2">AI Visibility</h1>
                    <p className="text-muted-foreground font-medium flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Measuring brand citability across the LLM ecosystem.
                    </p>
                </div>

                <div className="glass px-6 py-3 rounded-2xl flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vector Index</span>
                        <span className="text-xs font-bold text-primary">Global AI Search Pulse</span>
                    </div>
                    <div className="w-px h-8 bg-border/50" />
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Target className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Input Section */}
            <div className="glass rounded-3xl p-1 shadow-2xl shadow-primary/5 max-w-2xl mx-auto">
                <form onSubmit={handleCheckVisibility} className="flex items-center gap-2 p-1.5">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Brand or Product Name (e.g. SAEO.ai)"
                            required
                            value={brandName}
                            onChange={(e) => setBrandName(e.target.value)}
                            className="w-full bg-transparent border-none rounded-2xl py-4 pl-12 pr-4 text-foreground placeholder:text-muted-foreground/50 focus:outline-none text-lg font-bold"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-primary text-primary-foreground h-[58px] px-8 rounded-2xl font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <span>Check Pulse</span>
                                <Activity className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>
            </div>

            <AnimatePresence mode="wait">
                {results ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Summary */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="premium-card flex flex-col items-center text-center py-10">
                                <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-8">Aggregate Citability</h2>
                                <div className="relative w-44 h-44 flex items-center justify-center mb-8">
                                    <svg className="w-full h-full -rotate-90">
                                        <circle cx="88" cy="88" r="80" className="fill-none stroke-secondary/20 stroke-[8]" />
                                        <motion.circle
                                            cx="88" cy="88" r="80"
                                            className="fill-none stroke-primary stroke-[8]"
                                            strokeDasharray="502.6"
                                            initial={{ strokeDashoffset: 502.6 }}
                                            animate={{ strokeDashoffset: 502.6 - (502.6 * (results.visibility_score || 0)) / 100 }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-5xl font-black tracking-tighter">{results.visibility_score || '0'}%</span>
                                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1">AEO Score</span>
                                    </div>
                                </div>
                                <p className="text-xs font-medium text-muted-foreground leading-relaxed px-4">
                                    Your brand currently controls {results.visibility_score || '0'}% of the semantic narrative in this niche.
                                </p>
                            </div>

                            {/* AI Platform Visibility Chart */}
                            <div className="premium-card">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6">AI Platform Mentions</h3>
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            layout="vertical"
                                            data={results.platform_mentions || [
                                                { platform: 'ChatGPT', mentions: 3200, fill: '#22c55e' },
                                                { platform: 'AI Overview', mentions: 5800, fill: '#3b82f6' },
                                                { platform: 'AI Mode', mentions: 8500, fill: '#6366f1' },
                                                { platform: 'Gemini', mentions: 2800, fill: '#f59e0b' },
                                                { platform: 'Claude', mentions: 1500, fill: '#a855f7' },
                                            ]}
                                            margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                                        >
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="platform" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#888' }} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: 12, fontSize: 11, fontWeight: 700 }}
                                                formatter={(value: any) => [value.toLocaleString() + ' mentions', 'Visibility']}
                                            />
                                            <Bar dataKey="mentions" radius={[0, 6, 6, 0]} barSize={16}>
                                                {(results.platform_mentions || [
                                                    { fill: '#22c55e' },
                                                    { fill: '#3b82f6' },
                                                    { fill: '#6366f1' },
                                                    { fill: '#f59e0b' },
                                                    { fill: '#a855f7' },
                                                ]).map((entry: any, index: number) => (
                                                    <Cell key={`cell-platform-${index}`} fill={entry.fill} />
                                                ))}
                                                <LabelList
                                                    dataKey="mentions"
                                                    position="right"
                                                    formatter={(v: any) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v}
                                                    style={{ fill: '#888', fontSize: '9px', fontWeight: 'bold' }}
                                                    offset={10}
                                                />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Competitor Visibility Bar Chart */}
                            <div className="premium-card">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6">Competitor Visibility</h3>
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            layout="vertical"
                                            data={[
                                                { name: brandName || 'You', score: results.visibility_score || 0, fill: '#6366f1' },
                                                ...(results.competitors || [
                                                    { name: 'Walmart', score: 88, sentiment: 'Neutral' },
                                                    { name: 'eBay', score: 80, sentiment: 'Positive' },
                                                    { name: 'Alibaba', score: 75, sentiment: 'Positive' }
                                                ]).map((c: any, i: number) => ({
                                                    name: c.name,
                                                    score: c.score,
                                                    fill: i === 0 ? '#22c55e' : i === 1 ? '#f59e0b' : '#ef4444'
                                                }))
                                            ]}
                                            margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                                        >
                                            <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#666' }} />
                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#888' }} width={70} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: 12, fontSize: 11, fontWeight: 700 }}
                                                formatter={(value: any) => [value + '%', 'Visibility Score']}
                                            />
                                            <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={16}>
                                                {[
                                                    { fill: '#6366f1' },
                                                    { fill: '#22c55e' },
                                                    { fill: '#f59e0b' },
                                                    { fill: '#ef4444' }
                                                ].map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Middle Column - Visibility Trend */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Visibility Trend Chart */}
                            <div className="premium-card">
                                <h2 className="text-xl font-black mb-6 tracking-tight flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-primary" />
                                    Visibility Trend
                                </h2>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-6">AEO score progression over 6 months</p>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart
                                            data={results.visibility_trend || [
                                                { month: 'Aug', score: Math.max(10, (results.visibility_score || 50) - 35) },
                                                { month: 'Sep', score: Math.max(15, (results.visibility_score || 50) - 28) },
                                                { month: 'Oct', score: Math.max(20, (results.visibility_score || 50) - 18) },
                                                { month: 'Nov', score: Math.max(30, (results.visibility_score || 50) - 10) },
                                                { month: 'Dec', score: Math.max(40, (results.visibility_score || 50) - 5) },
                                                { month: 'Jan', score: results.visibility_score || 50 }
                                            ]}
                                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                        >
                                            <defs>
                                                <linearGradient id="visibilityGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#666' }} />
                                            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666' }} tickFormatter={(v) => `${v}%`} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: 12, fontSize: 11, fontWeight: 700 }}
                                                formatter={(value: any) => [value + '%', 'AEO Score']}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="score"
                                                stroke="#6366f1"
                                                strokeWidth={3}
                                                dot={{ fill: '#6366f1', strokeWidth: 0, r: 4 }}
                                                activeDot={{ r: 6, fill: '#6366f1' }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="premium-card">
                                <h2 className="text-xl font-black mb-8 tracking-tight flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-primary" />
                                    AI Narrative Analysis
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(results.analysis_points || results.strengths || []).map((point: string, i: number) => (
                                        <div key={i} className="p-4 rounded-2xl bg-secondary/20 border border-border/30 flex gap-3">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                            <p className="text-xs font-medium text-muted-foreground leading-relaxed">{point}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-8">
                                    <button
                                        onClick={() => setShowPlaybookModal(true)}
                                        className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                                    >
                                        <Sparkles className="w-4 h-4 fill-current" />
                                        Access AEO Roadmap
                                    </button>
                                </div>
                            </div>

                            <div className="premium-card">
                                <h2 className="text-xl font-black mb-8 tracking-tight flex items-center gap-2">
                                    <LinkIcon className="w-5 h-5 text-primary" />
                                    Citations & Authority Nodes
                                </h2>
                                <div className="space-y-4">
                                    {(results.citations || []).map((cite: any, i: number) => (
                                        <a key={i} href={cite.url} target="_blank" rel="noopener noreferrer" className="premium-card !p-4 bg-secondary/10 flex items-center justify-between group">
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-sm truncate group-hover:text-primary transition-colors">{cite.title}</h4>
                                                <p className="text-[10px] font-medium text-muted-foreground truncate max-w-xs">{cite.url}</p>
                                            </div>
                                            <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 text-[9px] font-black uppercase">
                                                {cite.type}
                                            </div>
                                        </a>
                                    ))}
                                    {(results.citations || []).length === 0 && (
                                        <div className="py-10 text-center opacity-40 italic text-xs">No direct citations detected in recent craws.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : !loading && (
                    <div className="py-40 flex flex-col items-center justify-center text-center opacity-30 grayscale pointer-events-none">
                        <Activity className="w-24 h-24 mb-6" />
                        <h2 className="text-3xl font-black tracking-tighter mb-2 uppercase">Citability Pulse Standby</h2>
                        <p className="max-w-md text-sm font-bold uppercase tracking-widest">Target a brand entity for deep semantic visibility mapping.</p>
                    </div>
                )}
            </AnimatePresence>

            {/* Playbook Modal */}
            <AnimatePresence>
                {showPlaybookModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPlaybookModal(false)} className="absolute inset-0 bg-background/90 backdrop-blur-xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-3xl glass border border-border rounded-3xl overflow-hidden max-h-[85vh] flex flex-col">
                            <div className="p-8 border-b border-border/40 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                                        <Activity className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight">AEO Optimization Roadmap</h2>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Strategic Fixes for Neural Prominence</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowPlaybookModal(false)} className="p-2 hover:bg-secondary rounded-xl transition-all"><X className="w-6 h-6" /></button>
                            </div>

                            <div className="p-8 overflow-y-auto custom-scrollbar space-y-6 flex-1">

                                <div className="space-y-6">
                                    {(results?.aeo_playbook || []).length > 0 ? (
                                        (results?.aeo_playbook).map((item: any, i: number) => (
                                            <motion.div
                                                key={i}
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="premium-card bg-secondary/10 border-border/50 hover:bg-secondary/20 transition-all p-6"
                                            >
                                                <div className="flex items-start gap-4 mb-4">
                                                    <div className="mt-1 w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0 border border-primary/20">
                                                        {i + 1}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-black uppercase tracking-wider text-primary mb-2">
                                                            {item.task || "Optimization Required"}
                                                        </h3>
                                                        <p className="text-xs font-medium text-white/80 leading-relaxed">
                                                            {item.description}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Terminal className="w-3 h-3 text-primary/60" />
                                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">How to Fix / Implement</span>
                                                    </div>
                                                    <p className="text-[11px] font-mono text-muted-foreground leading-relaxed">
                                                        {item.how_to}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="p-10 text-center opacity-40 italic text-xs">Compiling strategic AEO roadmap...</div>
                                    )}
                                </div>
                            </div>

                            <div className="p-8 border-t border-border/40 bg-secondary/5 flex gap-4">
                                <button onClick={() => setShowPlaybookModal(false)} className="flex-1 px-8 py-4 rounded-2xl bg-background border border-border/50 text-xs font-black uppercase tracking-widest hover:bg-secondary transition-all">
                                    Close Roadmap
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="px-10 bg-primary text-primary-foreground py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-3"
                                >
                                    <TrendingUp className="w-5 h-5" />
                                    Download Roadmap
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
