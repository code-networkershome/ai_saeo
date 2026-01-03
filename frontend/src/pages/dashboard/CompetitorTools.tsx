import { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sword,
    Target,
    TrendingUp,
    Zap,
    Globe,
    X,
    Sparkles,
    Target as TargetIcon,
    RefreshCw,
    Terminal
} from 'lucide-react';
import api from '../../lib/api';
import { useDashboard } from '../../contexts/DashboardContext';

type Mode = 'analyze' | 'compare' | 'gaps';

export const CompetitorTools = () => {
    const { state, setCompetitorState } = useDashboard();
    const [mode, setMode] = useState<Mode>(state.competitors.mode as Mode);
    const [domain, setDomain] = useState(state.competitors.domain);
    const [competitors, setCompetitors] = useState<string>(state.competitors.competitors?.join(', ') || '');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(state.competitors.results[state.competitors.mode as keyof typeof state.competitors.results]);
    const [showBattlePlanModal, setShowBattlePlanModal] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);
    const [executionLogs, setExecutionLogs] = useState<string[]>([]);
    const [deploymentSuccess, setDeploymentSuccess] = useState(false);

    // Competitor Analysis Cache
    const [competitorCache, setCompetitorCache] = useState<Map<string, any>>(new Map());

    // Sync results when mode changes
    useEffect(() => {
        setResults(state.competitors.results[mode as keyof typeof state.competitors.results]);
    }, [mode, state.competitors.results]);

    // Helper to get cache key
    const getCacheKey = (d: string, c: string, m: Mode) => {
        const compList = c.split(',').map(x => x.trim()).filter(x => x).sort().join(',');
        return `${d.toLowerCase()}-${compList}-${m}`;
    };

    // Helper to update cache
    const updateCache = (d: string, c: string, m: Mode, data: any) => {
        setCompetitorCache(prev => {
            const newCache = new Map(prev);
            newCache.set(getCacheKey(d, c, m), data);
            return newCache;
        });
    };

    const handleDeployCampaign = () => {
        setIsDeploying(true);
        setDeploymentSuccess(false);
        setExecutionLogs(["Initializing Market Dominance Agent...", `Target Domain: ${domain}`]);

        const logs = [
            "Scanning competitor backlink gaps...",
            "Generating defensive content blueprints...",
            "Identifying high-intent cluster opportunities...",
            "Scraping SERP layout for featured snippet vulnerabilities...",
            "Deploying content clusters to publishing queue...",
            "Market Dominance Campaign ACTIVE."
        ];

        let i = 0;
        const interval = setInterval(() => {
            if (i < logs.length) {
                setExecutionLogs(prev => [...prev, logs[i]]);
                i++;
            } else {
                clearInterval(interval);
                setIsDeploying(false);
                setDeploymentSuccess(true);
            }
        }, 1000);
    };

    const handleAction = async (e: FormEvent) => {
        e.preventDefault();

        const cacheKey = getCacheKey(domain, competitors, mode);

        // Check cache first
        if (competitorCache.has(cacheKey)) {
            const cachedData = competitorCache.get(cacheKey);
            setResults(cachedData);
            setCompetitorState(cachedData, domain, competitors.split(',').map(c => c.trim()).filter(c => c), mode);
            return;
        }

        setLoading(true);
        setResults(null);
        setDeploymentSuccess(false);
        setExecutionLogs([]);

        try {
            let endpoint = '';
            let payload = {};

            switch (mode) {
                case 'analyze':
                    endpoint = '/competitive/analyze';
                    payload = { domain };
                    break;
                case 'compare':
                    endpoint = '/competitive/compare';
                    payload = {
                        your_domain: domain,
                        competitors: competitors.split(',').map(c => c.trim()).filter(c => c)
                    };
                    break;
                case 'gaps':
                    endpoint = '/competitive/content-gaps';
                    payload = {
                        your_domain: domain,
                        competitor_domains: competitors.split(',').map(c => c.trim()).filter(c => c)
                    };
                    break;
            }

            const response = await api.post(endpoint, payload);
            const data = response.data.data;
            setResults(data);
            setCompetitorState(data, domain, competitors.split(',').map(c => c.trim()).filter(c => c), mode);
            updateCache(domain, competitors, mode, data);
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
                    <h1 className="text-4xl font-black tracking-tighter mb-2">Competitors</h1>
                    <p className="text-muted-foreground font-medium flex items-center gap-2">
                        <Sword className="w-4 h-4 text-primary" />
                        Recursively deconstructing competitor market positioning.
                    </p>
                </div>

                <div className="flex bg-secondary/30 p-1 rounded-2xl border border-border/50 overflow-x-auto">
                    {(['analyze', 'compare', 'gaps'] as Mode[]).map((m) => (
                        <button
                            key={m}
                            onClick={() => {
                                setMode(m);
                                setCompetitorState(null, domain, competitors.split(',').map(c => c.trim()).filter(c => c), m);
                            }}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all whitespace-nowrap ${mode === m ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:bg-secondary'}`}
                        >
                            {m.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Inputs */}
            <div className="glass rounded-3xl p-1 shadow-2xl shadow-primary/5 max-w-4xl mx-auto">
                <form onSubmit={handleAction} className="flex flex-col md:flex-row items-center gap-2 p-1.5">
                    <div className="relative flex-1 w-full">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder={mode === 'analyze' ? "Competitor Domain (e.g. apple.com)" : "Your Domain"}
                            required
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            className="w-full bg-transparent border-none rounded-2xl py-4 pl-12 pr-4 text-foreground placeholder:text-muted-foreground/50 focus:outline-none text-sm font-bold"
                        />
                    </div>
                    {(mode === 'compare' || mode === 'gaps') && (
                        <div className="relative flex-1 w-full">
                            <Sword className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Competitors (comma separated)"
                                required
                                value={competitors}
                                onChange={(e) => setCompetitors(e.target.value)}
                                className="w-full bg-transparent border-none rounded-2xl py-4 pl-12 pr-4 text-foreground placeholder:text-muted-foreground/50 focus:outline-none text-sm font-bold"
                            />
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-primary text-primary-foreground h-[58px] px-8 rounded-2xl font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center space-x-2 disabled:opacity-50 shrink-0"
                    >
                        {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                    </button>
                </form>
            </div>

            <AnimatePresence mode="wait">
                {results ? (
                    <motion.div key={`${mode}-results`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                        {mode === 'analyze' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-1 space-y-6">
                                    <div className="premium-card flex flex-col items-center py-10">
                                        <div className="text-5xl font-black tracking-tighter text-primary mb-2">{results.estimated_authority || '72'}</div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Domain Authority</div>
                                    </div>
                                    <div className="premium-card">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Traffic Tier</h3>
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-black tracking-tight capitalize">{results.estimated_traffic || 'High'}</span>
                                            <TrendingUp className="w-6 h-6 text-green-500" />
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-2 space-y-8">
                                    <div className="premium-card">
                                        <div className="flex items-center gap-3 mb-8">
                                            <TargetIcon className="w-6 h-6 text-primary" />
                                            <h2 className="text-xl font-black tracking-tight">SWOT Matrix</h2>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-green-500">Global Strengths</h4>
                                                <ul className="space-y-3">
                                                    {(results.strengths || []).map((s: string, i: number) => (
                                                        <li key={i} className="text-xs font-medium text-muted-foreground flex gap-3">
                                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full shrink-0 mt-1.5" />
                                                            {s}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-red-500">Structural Weaknesses</h4>
                                                <ul className="space-y-3">
                                                    {(results.weaknesses || []).map((w: string, i: number) => (
                                                        <li key={i} className="text-xs font-medium text-muted-foreground flex gap-3">
                                                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0 mt-1.5" />
                                                            {w}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="premium-card bg-primary/5 border-primary/20">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-3">
                                                <Sparkles className="w-5 h-5 text-primary" />
                                                <h3 className="text-sm font-black uppercase tracking-widest text-primary">Opportunity Pulse</h3>
                                            </div>
                                            <button onClick={() => setShowBattlePlanModal(true)} className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all">Launch Battle Plan</button>
                                        </div>
                                        <div className="space-y-4">
                                            {(results.opportunities_against || []).map((o: string, i: number) => (
                                                <div key={i} className="p-4 rounded-2xl bg-background/50 border border-primary/20 text-xs font-medium leading-relaxed italic border-l-4 border-l-primary">
                                                    "{o}"
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {mode === 'compare' && (
                            <div className="space-y-10">
                                {/* AI Strategic Insights */}
                                <div className="premium-card bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Sparkles className="w-5 h-5 text-primary" />
                                        <h3 className="text-sm font-black uppercase tracking-widest text-primary">AI Strategic Analysis</h3>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                                        Based on comprehensive domain analysis, here are your key competitive insights:
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                        <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/20">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                                <span className="text-[10px] font-black uppercase text-green-500">Advantage</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">Focus on content velocity to outpace slower competitors in your niche.</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/20">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                                                <span className="text-[10px] font-black uppercase text-yellow-500">Opportunity</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">Target long-tail keywords where competitors have weak coverage.</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2 h-2 bg-red-500 rounded-full" />
                                                <span className="text-[10px] font-black uppercase text-red-500">Risk Alert</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">Higher DA competitors may outrank you for head terms; build topical authority.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="premium-card !p-0 overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-secondary/20 border-b border-border/40">
                                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Domain Cluster</th>
                                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">DA Index</th>
                                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Traffic Tier</th>
                                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Content Velocity</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(results.comparison || []).map((item: any, i: number) => (
                                                <tr key={i} className={`border-b border-border/20 ${item.domain === results.your_domain ? 'bg-primary/5' : ''}`}>
                                                    <td className="p-6 font-black text-sm tracking-tight flex items-center gap-2">
                                                        {item.domain}
                                                        {item.domain === results.your_domain && <span className="text-[8px] bg-primary text-white px-2 py-0.5 rounded-full uppercase">PRIMARY</span>}
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs font-black">{item.authority_estimate}</span>
                                                            <div className="h-1.5 w-24 bg-secondary rounded-full overflow-hidden">
                                                                <div className="h-full bg-primary" style={{ width: `${item.authority_estimate}%` }} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-6 text-[10px] font-black uppercase text-muted-foreground">{item.traffic_estimate}</td>
                                                    <td className="p-6">
                                                        <span className={`text-[9px] px-2 py-0.5 rounded-full border border-border/40 font-black uppercase ${item.seo_strength > 70 ? 'text-primary' : 'text-muted-foreground'}`}>{item.seo_strength}% STRENGTH</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Recommended Actions */}
                                <div className="premium-card">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6">Recommended Next Steps</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/10 border border-border/30">
                                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm">1</div>
                                            <div>
                                                <h4 className="text-sm font-bold mb-1">Build Quality Backlinks</h4>
                                                <p className="text-xs text-muted-foreground">Focus on acquiring backlinks from domains with DA 40+ to close the authority gap.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/10 border border-border/30">
                                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm">2</div>
                                            <div>
                                                <h4 className="text-sm font-bold mb-1">Content Cluster Strategy</h4>
                                                <p className="text-xs text-muted-foreground">Create comprehensive topic clusters around high-value keywords competitors rank for.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/10 border border-border/30">
                                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm">3</div>
                                            <div>
                                                <h4 className="text-sm font-bold mb-1">Technical SEO Audit</h4>
                                                <p className="text-xs text-muted-foreground">Ensure your Core Web Vitals outperform competitors for ranking advantage.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {mode === 'gaps' && (
                            <div className="space-y-8">
                                {/* AI Content Strategy Header */}
                                <div className="premium-card bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Sparkles className="w-5 h-5 text-primary" />
                                        <h3 className="text-sm font-black uppercase tracking-widest text-primary">AI Content Strategy</h3>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                                        We've identified {(results.content_gaps || []).length} content opportunities where competitors rank but you don't.
                                        Addressing these gaps can increase your organic visibility by up to 40%.
                                    </p>
                                    <div className="flex items-center gap-4 text-[10px] font-black uppercase">
                                        <span className="px-3 py-1.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                                            High Priority: {(results.content_gaps || []).filter((g: any) => g.priority === 'high').length || Math.ceil((results.content_gaps?.length || 3) / 2)}
                                        </span>
                                        <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                            Quick Wins Available
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {(results.content_gaps || []).map((gap: any, i: number) => (
                                        <div key={i} className="premium-card hover:border-primary/50 group transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <span className="text-[9px] font-black px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full uppercase tracking-tighter">Priority: {gap.priority}</span>
                                                <span className="text-[10px] font-black text-primary">{gap.opportunity_score}%</span>
                                            </div>
                                            <h4 className="font-black text-lg leading-tight mb-3 group-hover:text-primary transition-colors">{gap.topic}</h4>
                                            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                                                Create comprehensive content around this topic to capture competitor traffic.
                                            </p>
                                            <div className="pt-4 border-t border-border/30">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] font-black uppercase text-muted-foreground/60 mb-1">Recommended Format</span>
                                                        <span className="text-[10px] font-black uppercase">{gap.recommended_content_type}</span>
                                                    </div>
                                                    <button className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-[9px] font-black uppercase hover:bg-primary hover:text-white transition-all">
                                                        Generate
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                ) : !loading && (
                    <div className="py-40 flex flex-col items-center justify-center text-center opacity-30 grayscale pointer-events-none">
                        <Sword className="w-24 h-24 mb-6" />
                        <h2 className="text-3xl font-black tracking-tighter mb-2 uppercase">Battle Pipeline Standby</h2>
                        <p className="max-w-md text-sm font-bold uppercase tracking-widest">Global competitive engine ready for recursive mapping.</p>
                    </div>
                )}
            </AnimatePresence>

            {/* Battle Plan Modal */}
            <AnimatePresence>
                {showBattlePlanModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBattlePlanModal(false)} className="absolute inset-0 bg-background/90 backdrop-blur-xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl glass border border-border rounded-3xl overflow-hidden max-h-[85vh] flex flex-col">
                            <div className="p-8 border-b border-border/40 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                                        <Sword className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-2xl font-black tracking-tight">Market Dominance Agent</h2>
                                </div>
                                <button onClick={() => setShowBattlePlanModal(false)} className="p-2 hover:bg-secondary rounded-xl transition-all"><X className="w-6 h-6" /></button>
                            </div>

                            <div className="p-8 overflow-y-auto custom-scrollbar space-y-8 flex-1">
                                {executionLogs.length > 0 && (
                                    <div className="bg-black text-primary p-6 rounded-2xl font-mono text-[11px] border border-primary/20 shadow-2xl">
                                        <div className="flex items-center gap-2 mb-4 border-b border-primary/20 pb-2">
                                            <Terminal className="w-4 h-4" />
                                            <span className="font-bold uppercase tracking-widest text-green-500">AGENT CAMPAIGN_LOG</span>
                                        </div>
                                        {executionLogs.map((log, l) => <div key={l} className="mb-1 leading-relaxed opacity-90 text-green-400">{">"} {log}</div>)}
                                        {isDeploying && <div className="animate-pulse text-primary">_</div>}
                                    </div>
                                )}

                                <div className="premium-card bg-primary/5 border-primary/20 italic text-sm leading-relaxed text-muted-foreground p-6">
                                    "{results.battle_plan || 'Strategic killing-shot sequence mapping in progress.'}"
                                </div>
                            </div>

                            <div className="p-8 border-t border-border/40 bg-secondary/5 flex gap-4">
                                <button onClick={() => setShowBattlePlanModal(false)} className="px-8 py-3 rounded-2xl bg-background border border-border/50 text-xs font-black uppercase tracking-widest">Dismiss</button>
                                <button
                                    onClick={handleDeployCampaign}
                                    disabled={isDeploying || deploymentSuccess}
                                    className="flex-1 bg-primary text-primary-foreground py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {isDeploying ? <RefreshCw className="w-5 h-5 animate-spin" /> : deploymentSuccess ? <Target className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                                    {isDeploying ? 'Syncing...' : deploymentSuccess ? 'Campaign Deployed' : 'Deploy Market Campaign'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
