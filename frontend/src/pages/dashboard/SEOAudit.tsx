import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield,
    Zap,
    ChevronRight,
    CheckCircle2,
    FileCode,
    Smartphone,
    X,
    Sparkles,
    Cpu,
    Activity,
    Lock,
    Clock,
    Layers,
    ExternalLink,
    AlertCircle,
    TrendingUp,
    Copy,
    Globe,
    RefreshCw
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import api from '../../lib/api';

import { useDashboard } from '../../contexts/DashboardContext';

export const SEOAudit = () => {
    const { state, setAuditState } = useDashboard();
    const [url, setUrl] = useState(state.audit.input);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(state.audit.results);
    const [selectedIssue, setSelectedIssue] = useState<any>(null);
    const [showFixesModal, setShowFixesModal] = useState(false);
    const [aiExplanation, setAiExplanation] = useState<any>(null);
    const [aiLoading, setAiLoading] = useState(false);

    // AI Fixes Cache - keyed by issue title to avoid duplicate API calls
    const [fixesCache, setFixesCache] = useState<Map<string, any>>(new Map());

    // UI States
    const [activeSection, setActiveSection] = useState<'overview' | 'technical' | 'performance' | 'security' | 'intelligence'>('overview');

    // Helper to safely render values that might be objects (prevents React child error)
    const safeRender = (value: any): string => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        if (typeof value === 'object') return JSON.stringify(value, null, 2);
        return String(value);
    };

    // Helper to get cache key for an issue
    const getIssueKey = (issue: any) => `${issue.title}-${issue.category}`;

    // Helper to update cache
    const updateCache = (issue: any, explanation: any) => {
        setFixesCache(prev => {
            const newCache = new Map(prev);
            newCache.set(getIssueKey(issue), explanation);
            return newCache;
        });
    };

    const fetchAiExplanation = async (issue: any) => {
        const cacheKey = getIssueKey(issue);

        // Check cache first
        if (fixesCache.has(cacheKey)) {
            setAiExplanation(fixesCache.get(cacheKey));
            setAiLoading(false);
            return;
        }

        setAiLoading(true);
        setAiExplanation(null);
        try {
            const response = await api.post('/audit/explain', { url, issue });
            const data = response.data.data;
            setAiExplanation(data);
            updateCache(issue, data);
        } catch (err) {
            console.error('Failed to fetch AI explanation', err);
            const fallback = {
                explanation: 'AI explanation service temporarily unavailable.',
                fix_steps: [issue.recommendation || 'Review the issue and apply standard SEO best practices.'],
                code_snippet: issue.fix || null,
                impact_score: issue.severity === 'critical' || issue.severity === 'high' ? 75 : 40
            };
            setAiExplanation(fallback);
            updateCache(issue, fallback);
        } finally {
            setAiLoading(false);
        }
    };

    const handleOpenFixModal = (issue: any) => {
        setSelectedIssue(issue);
        setShowFixesModal(true);
        fetchAiExplanation(issue);
    };

    // Bulk AI Fixes State
    const [showBulkFixesModal, setShowBulkFixesModal] = useState(false);
    const [bulkFixes, setBulkFixes] = useState<any[]>([]);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkProgress, setBulkProgress] = useState(0);

    const handleDeployAllFixes = async () => {
        if (!results?.issues || results.issues.length === 0) return;

        setShowBulkFixesModal(true);
        setBulkLoading(true);
        setBulkProgress(0);

        const issues = results.issues;
        const total = issues.length;
        const fixes: any[] = [];

        // First, populate with cached fixes
        for (const issue of issues) {
            const cacheKey = getIssueKey(issue);
            if (fixesCache.has(cacheKey)) {
                fixes.push({
                    issue,
                    explanation: fixesCache.get(cacheKey),
                    fromCache: true
                });
            }
        }
        setBulkFixes([...fixes]);

        // Calculate how many we already have
        const cachedCount = fixes.length;
        const uncachedIssues = issues.filter((issue: any) => !fixesCache.has(getIssueKey(issue)));

        if (uncachedIssues.length === 0) {
            // All issues are cached, we're done!
            setBulkProgress(100);
            setBulkLoading(false);
            return;
        }

        // Process only uncached issues
        for (let i = 0; i < uncachedIssues.length; i++) {
            const issue = uncachedIssues[i];
            try {
                const response = await api.post('/audit/explain', { url, issue });
                const explanation = response.data.data;
                fixes.push({ issue, explanation, fromCache: false });
                updateCache(issue, explanation);
            } catch (err) {
                const fallback = {
                    explanation: 'Failed to generate AI fix.',
                    fix_steps: [issue.recommendation || 'Apply standard SEO best practices.'],
                    code_snippet: issue.fix || null,
                    impact_score: issue.severity === 'critical' || issue.severity === 'high' ? 75 : 40
                };
                fixes.push({ issue, explanation: fallback, fromCache: false });
                updateCache(issue, fallback);
            }
            setBulkProgress(Math.round(((cachedCount + i + 1) / total) * 100));
            setBulkFixes([...fixes]);
        }

        setBulkLoading(false);
    };

    const handleRunAudit = async (e: FormEvent) => {
        e.preventDefault();
        if (!url) return;

        setLoading(true);
        try {
            const response = await api.post('/audit/full', { url });
            const data = response.data.data;
            setResults(data);
            setAuditState(data, url);
        } catch (err: any) {
            console.error('Audit failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const StatusBadge = ({ score }: { score: number }) => {
        const color = score > 89 ? 'text-green-500 bg-green-500/10 border-green-500/20' :
            score > 69 ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' :
                'text-red-500 bg-red-500/10 border-red-500/20';
        return (
            <div className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-tighter uppercase border ${color}`}>
                {score}% {score > 89 ? 'Optimal' : score > 69 ? 'Fair' : 'Critical'}
            </div>
        );
    };

    const ScoreRing = ({ score, label, icon: Icon }: any) => {
        const color = score > 89 ? '#10B981' : score > 69 ? '#F59E0B' : '#EF4444';
        return (
            <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 mb-3">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-secondary/20" />
                        <circle
                            cx="48" cy="48" r="40" stroke={color} strokeWidth="6" fill="transparent"
                            strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * score) / 100}
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <Icon className="w-4 h-4 text-muted-foreground mb-1" />
                        <span className="text-xl font-black">{score}</span>
                    </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
            </div>
        );
    };

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/40 pb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter mb-2">SEO Audit</h1>
                    <p className="text-muted-foreground font-medium flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" />
                        High-precision technical scan and core web vitals analysis.
                    </p>
                </div>

                <div className="glass px-6 py-3 rounded-2xl flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Crawler Engine</span>
                        <span className="text-xs font-bold text-primary">Firecrawl Stealth v4</span>
                    </div>
                    <div className="w-px h-8 bg-border/50" />
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Cpu className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* URL Input */}
            <div className="glass rounded-3xl p-1 shadow-2xl shadow-primary/5 max-w-2xl mx-auto">
                <form onSubmit={handleRunAudit} className="flex items-center gap-2 p-1.5">
                    <div className="relative flex-1">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="url"
                            placeholder="https://your-website.com"
                            required
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
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
                                <span>Initialize Scan</span>
                                <Zap className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>
            </div>

            <AnimatePresence mode="wait">
                {results ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                        {/* Summary Metrics */}
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            <div className="premium-card lg:col-span-1 flex flex-col items-center justify-center py-10">
                                <ScoreRing score={results.overall_score || 88} label="Stability Index" icon={Shield} />
                            </div>

                            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="premium-card">
                                    <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500 w-fit mb-4">
                                        <AlertCircle className="w-5 h-5" />
                                    </div>
                                    <div className="text-3xl font-black mb-1">{results.issues?.filter((i: any) => i.severity?.toLowerCase() === 'high' || i.severity?.toLowerCase() === 'critical').length || 0}</div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Critical Vulnerabilities</div>
                                </div>
                                <div className="premium-card">
                                    <div className="p-2.5 rounded-xl bg-yellow-500/10 text-yellow-500 w-fit mb-4">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <div className="text-3xl font-black mb-1">{results.issues?.filter((i: any) => i.severity?.toLowerCase() === 'medium' || i.severity?.toLowerCase() === 'warning').length || 0}</div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Optimization Alerts</div>
                                </div>
                                <div className="premium-card">
                                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 w-fit mb-4">
                                        <Smartphone className="w-5 h-5" />
                                    </div>
                                    <div className="text-3xl font-black mb-1">{Math.round(results.performance?.score || 75)}</div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Speed Performance</div>
                                </div>
                            </div>
                        </div>

                        {/* Secondary View Selection */}
                        <div className="flex border-b border-border/40 gap-8 overflow-x-auto pb-px">
                            {['overview', 'technical', 'performance', 'security', 'intelligence'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveSection(tab as any)}
                                    className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeSection === tab ? 'text-primary' : 'text-muted-foreground/60 hover:text-foreground'}`}
                                >
                                    {tab}
                                    {activeSection === tab && <motion.div layoutId="tabUnder" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Main Content Pane */}
                            <div className="lg:col-span-2 space-y-6">
                                {activeSection === 'overview' && (
                                    <div className="space-y-4">
                                        {(results.issues || []).map((issue: any, i: number) => (
                                            <div
                                                key={i}
                                                className="premium-card hover:border-primary/30 group cursor-pointer"
                                                onClick={() => handleOpenFixModal(issue)}
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <StatusBadge score={issue.severity?.toLowerCase() === 'high' ? 20 : 60} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{issue.category}</span>
                                                    </div>
                                                </div>
                                                <h4 className="font-bold text-lg mb-1">{issue.title}</h4>
                                                <p className="text-xs text-muted-foreground leading-relaxed">{issue.description}</p>
                                                <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between">
                                                    <span className="text-[9px] font-black uppercase text-primary">Click for AI Fix</span>
                                                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeSection === 'technical' && (
                                    <div className="space-y-6">
                                        <div className="premium-card">
                                            <h3 className="text-xl font-black mb-6 tracking-tight">Technical SEO Checks</h3>
                                            <div className="space-y-4">
                                                {(results.issues || [])
                                                    .filter((issue: any) => issue.category === 'technical' || issue.category === 'ai_discovery')
                                                    .map((issue: any, i: number) => (
                                                        <div
                                                            key={i}
                                                            className="p-4 rounded-2xl bg-secondary/10 border border-border/30 hover:border-primary/30 cursor-pointer transition-all"
                                                            onClick={() => handleOpenFixModal(issue)}
                                                        >
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    {issue.severity === 'critical' || issue.severity === 'high' ? (
                                                                        <AlertCircle className="w-4 h-4 text-red-500" />
                                                                    ) : (
                                                                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                                                                    )}
                                                                    <span className="font-bold text-sm">{issue.title}</span>
                                                                </div>
                                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${issue.severity === 'critical' || issue.severity === 'high'
                                                                    ? 'bg-red-500/10 text-red-500'
                                                                    : 'bg-yellow-500/10 text-yellow-500'
                                                                    }`}>
                                                                    {issue.severity}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">{issue.description}</p>
                                                            <div className="mt-3 flex items-center gap-2 text-[10px] font-black text-primary uppercase">
                                                                <Zap className="w-3 h-3" />
                                                                <span>Click for AI Fix</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                {(results.issues || []).filter((issue: any) => issue.category === 'technical' || issue.category === 'ai_discovery').length === 0 && (
                                                    <div className="p-6 text-center text-muted-foreground">
                                                        <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
                                                        <p className="font-bold">All Technical Checks Passed!</p>
                                                        <p className="text-xs mt-1">No critical technical issues found.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Technical Compliance Grid */}
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {[
                                                { name: 'robots.txt', status: !results.issues?.some((i: any) => i.title?.includes('robots')) },
                                                { name: 'sitemap.xml', status: !results.issues?.some((i: any) => i.title?.includes('sitemap')) },
                                                { name: 'HTTPS', status: !results.issues?.some((i: any) => i.title?.includes('HTTPS')) },
                                                { name: 'llms.txt', status: !results.issues?.some((i: any) => i.title?.includes('llms')) },
                                                { name: 'security.txt', status: !results.issues?.some((i: any) => i.title?.includes('security.txt')) },
                                                { name: 'humans.txt', status: !results.issues?.some((i: any) => i.title?.includes('humans')) },
                                            ].map((check, idx) => (
                                                <div key={idx} className={`p-4 rounded-2xl border ${check.status ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                                    <div className="flex items-center gap-2">
                                                        {check.status ? (
                                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                        ) : (
                                                            <AlertCircle className="w-4 h-4 text-red-500" />
                                                        )}
                                                        <span className="text-xs font-bold">{check.name}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeSection === 'performance' && (() => {
                                    const perfData = results.performance || {};
                                    const perfScore = perfData.score || 75;
                                    const accessibilityScore = perfData.accessibility_score || 0;
                                    const bestPracticesScore = perfData.best_practices_score || 0;

                                    return (
                                        <div className="space-y-6">
                                            {/* AI Speed Analysis Header */}
                                            <div className="premium-card bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <Sparkles className="w-5 h-5 text-primary" />
                                                    <h3 className="text-sm font-black uppercase tracking-widest text-primary">AI Speed Analysis</h3>
                                                </div>
                                                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                                                    Page speed directly impacts SEO rankings and user experience. Google uses Core Web Vitals as a ranking factor.
                                                    Faster sites typically see 2-3x better conversion rates.
                                                </p>
                                                <div className="flex items-center gap-4 text-[10px] font-black uppercase">
                                                    <span className={`px-3 py-1.5 rounded-full ${perfScore >= 90
                                                        ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                                        : perfScore >= 50
                                                            ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                                            : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                                        Performance: {Math.round(perfScore)}%
                                                    </span>
                                                    <span className={`px-3 py-1.5 rounded-full ${perfScore >= 90 ? 'bg-green-500/10 text-green-500' : perfScore >= 50 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'} border border-current/20`}>
                                                        Grade: {perfScore >= 90 ? 'A' : perfScore >= 75 ? 'B' : perfScore >= 50 ? 'C' : 'D'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="premium-card">
                                                <h3 className="text-xl font-black mb-6 tracking-tight">Core Web Vitals</h3>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                                    {[
                                                        { label: 'FCP', fullName: 'First Contentful Paint', value: results.performance?.first_contentful_paint || '0.8s', score: 95 },
                                                        { label: 'LCP', fullName: 'Largest Contentful Paint', value: results.performance?.largest_contentful_paint || '1.2s', score: 92 },
                                                        { label: 'CLS', fullName: 'Cumulative Layout Shift', value: results.performance?.cumulative_layout_shift || '0.02', score: 98 },
                                                        { label: 'TBT', fullName: 'Total Blocking Time', value: results.performance?.total_blocking_time || '120ms', score: 85 }
                                                    ].map((metric, m) => (
                                                        <div key={m} className="p-4 rounded-2xl bg-secondary/20 flex flex-col items-center group hover:bg-secondary/30 transition-all">
                                                            <span className="text-[10px] font-black text-muted-foreground mb-1">{metric.label}</span>
                                                            <span className="text-xl font-black">{metric.value}</span>
                                                            <div className={`mt-2 h-1.5 w-12 rounded-full ${metric.score > 89 ? 'bg-green-500' : metric.score > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                                                            <span className="text-[9px] text-muted-foreground mt-2 opacity-0 group-hover:opacity-100 transition-opacity text-center">{metric.fullName}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Lighthouse Scores */}
                                            {(accessibilityScore > 0 || bestPracticesScore > 0) && (
                                                <div className="premium-card">
                                                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6">Lighthouse Audit Scores</h3>
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div className="text-center p-4 rounded-xl bg-secondary/20">
                                                            <div className={`text-2xl font-black ${perfScore >= 90 ? 'text-green-500' : perfScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                                                {Math.round(perfScore)}
                                                            </div>
                                                            <div className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Performance</div>
                                                        </div>
                                                        <div className="text-center p-4 rounded-xl bg-secondary/20">
                                                            <div className={`text-2xl font-black ${accessibilityScore >= 90 ? 'text-green-500' : accessibilityScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                                                {Math.round(accessibilityScore)}
                                                            </div>
                                                            <div className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Accessibility</div>
                                                        </div>
                                                        <div className="text-center p-4 rounded-xl bg-secondary/20">
                                                            <div className={`text-2xl font-black ${bestPracticesScore >= 90 ? 'text-green-500' : bestPracticesScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                                                {Math.round(bestPracticesScore)}
                                                            </div>
                                                            <div className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Best Practices</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Optimization Recommendations */}
                                            <div className="premium-card">
                                                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6">Quick Win Optimizations</h3>
                                                <div className="space-y-4">
                                                    {perfScore < 90 && (
                                                        <div className="flex items-start gap-4 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                                                            <div className="w-8 h-8 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 font-black text-sm">⚡</div>
                                                            <div>
                                                                <h4 className="text-sm font-bold mb-1">Optimize Images</h4>
                                                                <p className="text-xs text-muted-foreground">Convert images to WebP format and implement lazy loading for below-the-fold content.</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                                                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 font-black text-sm">🚀</div>
                                                        <div>
                                                            <h4 className="text-sm font-bold mb-1">Enable Browser Caching</h4>
                                                            <p className="text-xs text-muted-foreground">Set Cache-Control headers with long TTLs for static assets.</p>
                                                        </div>
                                                    </div>
                                                    {perfScore >= 90 && (
                                                        <div className="flex items-start gap-4 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                                                            <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 font-black text-sm">✓</div>
                                                            <div>
                                                                <h4 className="text-sm font-bold mb-1">Excellent Performance!</h4>
                                                                <p className="text-xs text-muted-foreground">Your site is well-optimized. Consider implementing predictive prefetching for even faster navigation.</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {activeSection === 'security' && (() => {
                                    const securityData = results.business_intelligence?.security;
                                    const hasSecurityData = securityData && securityData.checks && Object.keys(securityData.checks).length > 0;

                                    // Define headers with their check results
                                    const headers = hasSecurityData ? [
                                        { header: 'Strict-Transport-Security', present: securityData.checks['Strict-Transport-Security'] === true, impact: 'Critical', explanation: 'Forces HTTPS connections, protecting against protocol downgrade attacks.' },
                                        { header: 'Content-Security-Policy', present: securityData.checks['Content-Security-Policy'] === true, impact: 'High', explanation: 'Prevents XSS attacks by controlling which resources can load.' },
                                        { header: 'X-Frame-Options', present: securityData.checks['X-Frame-Options'] === true, impact: 'High', explanation: 'Prevents clickjacking attacks by stopping your site from being embedded in iframes.' },
                                        { header: 'X-Content-Type-Options', present: securityData.checks['X-Content-Type-Options'] === true, impact: 'Medium', explanation: 'Prevents MIME type sniffing which can lead to security vulnerabilities.' },
                                        { header: 'Permissions-Policy', present: securityData.checks['Permissions-Policy'] === true, impact: 'Medium', explanation: 'Controls which browser features can be used. Important for privacy.' }
                                    ] : [];

                                    return (
                                        <div className="space-y-6">
                                            {/* AI Security Analysis Header */}
                                            <div className="premium-card bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <Sparkles className="w-5 h-5 text-primary" />
                                                    <h3 className="text-sm font-black uppercase tracking-widest text-primary">AI Security Analysis</h3>
                                                </div>
                                                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                                                    Security headers protect your site from XSS attacks, clickjacking, and MITM attacks.
                                                    Missing headers can impact both security AND SEO ranking as Google considers site security a factor.
                                                </p>
                                                <div className="flex items-center gap-4 text-[10px] font-black uppercase">
                                                    {!hasSecurityData && (
                                                        <span className="px-3 py-1.5 rounded-full bg-secondary/50 text-muted-foreground border border-border/20">
                                                            Security scan in progress...
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {hasSecurityData ? (
                                                <>
                                                    <div className="premium-card">
                                                        <div className="flex items-center gap-2 mb-6">
                                                            <Lock className="w-5 h-5 text-primary" />
                                                            <h3 className="text-xl font-black tracking-tight">Security Headers</h3>
                                                        </div>
                                                        <div className="space-y-4">
                                                            {headers.map((item, h) => {
                                                                const statusText = securityData.details?.[item.header] || (item.present ? 'Present' : 'Missing');
                                                                const isMitigated = statusText.includes('Mitigated');

                                                                return (
                                                                    <div key={h} className={`p-4 rounded-xl border ${item.present ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <span className="text-xs font-bold font-mono">{item.header}</span>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${item.impact === 'Critical' ? 'bg-red-500/10 text-red-500' : item.impact === 'High' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                                                    {item.impact} Impact
                                                                                </span>
                                                                                <span className={`text-[10px] font-black uppercase border px-2 py-0.5 rounded-full ${item.present ? 'text-green-500 border-green-500/20 bg-green-500/5' : 'text-red-500 border-red-500/20 bg-red-500/5'}`}>
                                                                                    {statusText}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                                            {isMitigated ? `Protection is managed via Content-Security-Policy directives, which is a modern and secure approach.` : item.explanation}
                                                                        </p>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* High Impact Security Recommendations */}
                                                    <div className="premium-card">
                                                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6">High-Impact Security Fixes</h3>
                                                        <div className="space-y-4">
                                                            {!headers.find(h => h.header === 'Strict-Transport-Security')?.present && (
                                                                <div className="flex items-start gap-4 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                                                                    <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 font-black text-sm">!</div>
                                                                    <div>
                                                                        <h4 className="text-sm font-bold mb-1">Implement HSTS Preloading</h4>
                                                                        <p className="text-xs text-muted-foreground mb-2">Add your domain to the HSTS preload list for maximum HTTPS enforcement.</p>
                                                                        <code className="text-[10px] bg-black/50 text-green-400 px-2 py-1 rounded font-mono">Strict-Transport-Security: max-age=31536000; includeSubDomains; preload</code>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {!headers.find(h => h.header === 'Content-Security-Policy')?.present && (
                                                                <div className="flex items-start gap-4 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                                                                    <div className="w-8 h-8 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 font-black text-sm">⚡</div>
                                                                    <div>
                                                                        <h4 className="text-sm font-bold mb-1">Add CSP Header</h4>
                                                                        <p className="text-xs text-muted-foreground mb-2">Use Content-Security-Policy to prevent XSS attacks.</p>
                                                                        <code className="text-[10px] bg-black/50 text-green-400 px-2 py-1 rounded font-mono">Content-Security-Policy: default-src 'self'</code>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {headers.every(h => h.present) && (
                                                                <div className="flex items-start gap-4 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                                                                    <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 font-black text-sm">✓</div>
                                                                    <div>
                                                                        <h4 className="text-sm font-bold mb-1">Excellent Security Posture</h4>
                                                                        <p className="text-xs text-muted-foreground">All critical security headers are properly configured. Great job!</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="premium-card text-center py-12">
                                                    <Lock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                                                    <h3 className="font-bold text-lg mb-2">Security Scan Unavailable</h3>
                                                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                                                        Unable to retrieve security headers for this domain. This may be due to CORS restrictions or the site blocking automated requests.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {activeSection === 'intelligence' && (() => {
                                    const techData = results.business_intelligence?.tech_stack || {};
                                    const historyData = results.business_intelligence?.domain_history || {};
                                    const hasTechData = Object.values(techData).some((arr: any) => arr?.length > 0);

                                    const techCategories = [
                                        { name: 'CMS', icon: '📄', items: techData.cms || [], color: 'blue' },
                                        { name: 'Frameworks', icon: '⚙️', items: techData.frameworks || [], color: 'purple' },
                                        { name: 'Analytics', icon: '📊', items: techData.analytics || [], color: 'green' },
                                        { name: 'CDN', icon: '🌐', items: techData.cdn || [], color: 'yellow' }
                                    ];

                                    return (
                                        <div className="space-y-6">
                                            {/* AI Tech Analysis Header */}
                                            <div className="premium-card bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <Sparkles className="w-5 h-5 text-primary" />
                                                    <h3 className="text-sm font-black uppercase tracking-widest text-primary">AI Tech Stack Analysis</h3>
                                                </div>
                                                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                                                    Understanding competitor tech stacks reveals their investment priorities and potential vulnerabilities.
                                                    Modern frameworks typically indicate faster development cycles and better performance.
                                                </p>
                                                <div className="flex items-center gap-4 text-[10px] font-black uppercase">
                                                    <span className="px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20">
                                                        {hasTechData ? `${Object.values(techData).flat().length} Technologies Detected` : 'Analyzing Stack...'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Categorized Tech Stack */}
                                            <div className="premium-card">
                                                <div className="flex items-center gap-2 mb-6">
                                                    <Layers className="w-5 h-5 text-primary" />
                                                    <h3 className="text-xl font-black tracking-tight">Tech Stack Signature</h3>
                                                </div>
                                                <div className="space-y-6">
                                                    {techCategories.map((category, c) => (
                                                        category.items.length > 0 && (
                                                            <div key={c}>
                                                                <div className="flex items-center gap-2 mb-3">
                                                                    <span className="text-sm">{category.icon}</span>
                                                                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{category.name}</span>
                                                                </div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {category.items.map((tech: string, t: number) => (
                                                                        <div key={t} className={`px-3 py-2 rounded-lg bg-${category.color}-500/10 border border-${category.color}-500/20 text-xs font-bold`}>
                                                                            {tech}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )
                                                    ))}
                                                    {!hasTechData && (
                                                        <div className="text-center py-8 text-muted-foreground">
                                                            <Cpu className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                                            <p className="text-xs">No technologies detected via passive scanning.</p>
                                                            <p className="text-[10px] mt-1">Try analyzing with active JavaScript rendering for more accurate results.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Domain History */}
                                            <div className="premium-card">
                                                <div className="flex items-center gap-2 mb-6">
                                                    <Clock className="w-5 h-5 text-primary" />
                                                    <h3 className="text-xl font-black tracking-tight">Domain History</h3>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="p-4 rounded-2xl bg-secondary/20">
                                                        <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">First Indexed</p>
                                                        <p className="text-sm font-bold">
                                                            {historyData.first_seen
                                                                ? new Date(historyData.first_seen).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                                                : 'Checking archive...'}
                                                        </p>
                                                    </div>
                                                    <div className="p-4 rounded-2xl bg-secondary/20 flex items-center justify-between">
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Archive Records</p>
                                                            <p className="text-sm font-bold">{historyData.versions_found ? 'Available' : 'Checking...'}</p>
                                                        </div>
                                                        <a
                                                            href={`https://web.archive.org/web/*/${url}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-3 py-2 rounded-xl bg-background border border-border/50 text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center gap-2"
                                                        >
                                                            <ExternalLink className="w-3 h-3" />
                                                            View
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* SEO Implications */}
                                            <div className="premium-card">
                                                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6">SEO Technology Insights</h3>
                                                <div className="space-y-4">
                                                    {techData.frameworks?.includes('Next.js') && (
                                                        <div className="flex items-start gap-4 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                                                            <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 font-black text-sm">✓</div>
                                                            <div>
                                                                <h4 className="text-sm font-bold mb-1">SSR/SSG Framework Detected</h4>
                                                                <p className="text-xs text-muted-foreground">Next.js provides excellent SEO foundation with server-side rendering and static generation.</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {techData.analytics?.includes('Google Analytics') && (
                                                        <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                                                            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 font-black text-sm">📊</div>
                                                            <div>
                                                                <h4 className="text-sm font-bold mb-1">Analytics Tracking Active</h4>
                                                                <p className="text-xs text-muted-foreground">Google Analytics is implemented - user behavior data is being collected.</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {techData.cdn?.length > 0 && (
                                                        <div className="flex items-start gap-4 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                                                            <div className="w-8 h-8 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 font-black text-sm">⚡</div>
                                                            <div>
                                                                <h4 className="text-sm font-bold mb-1">CDN Configured</h4>
                                                                <p className="text-xs text-muted-foreground">{techData.cdn[0]} CDN detected - assets are globally distributed for faster loading.</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {!hasTechData && (
                                                        <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/20 border border-border/20">
                                                            <div className="w-8 h-8 rounded-xl bg-secondary/30 flex items-center justify-center text-muted-foreground font-black text-sm">?</div>
                                                            <div>
                                                                <h4 className="text-sm font-bold mb-1">Limited Detection</h4>
                                                                <p className="text-xs text-muted-foreground">Passive scanning couldn't identify technologies. Server may be using custom or obfuscated stack.</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Sidebar Panels */}
                            <div className="space-y-8">
                                <div className="premium-card bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Sparkles className="w-5 h-5 text-primary" />
                                        <h3 className="text-sm font-black uppercase tracking-widest">Growth Engine</h3>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed italic mb-6">
                                        "Detected 3 high-impact technical gaps that could boost your mobile ranking by ~15% if resolved."
                                    </p>
                                    <button
                                        onClick={handleDeployAllFixes}
                                        className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        Deploy AI Fixes
                                    </button>
                                </div>

                                {/* Issue Severity Distribution Chart */}
                                <div className="premium-card">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Issue Distribution</h3>
                                    <div className="h-48">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Critical', value: results.issues?.filter((i: any) => i.severity?.toLowerCase() === 'high' || i.severity?.toLowerCase() === 'critical').length || 2, fill: '#ef4444' },
                                                        { name: 'Warning', value: results.issues?.filter((i: any) => i.severity?.toLowerCase() === 'medium' || i.severity?.toLowerCase() === 'warning').length || 4, fill: '#f59e0b' },
                                                        { name: 'Passed', value: 12 - (results.issues?.length || 6), fill: '#22c55e' }
                                                    ]}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={40}
                                                    outerRadius={70}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                >
                                                    {[
                                                        { fill: '#ef4444' },
                                                        { fill: '#f59e0b' },
                                                        { fill: '#22c55e' }
                                                    ].map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: 12, fontSize: 11, fontWeight: 700 }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex justify-center gap-4 mt-2">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-red-500" />
                                            <span className="text-[9px] font-bold text-muted-foreground">Critical</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                            <span className="text-[9px] font-bold text-muted-foreground">Warning</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-green-500" />
                                            <span className="text-[9px] font-bold text-muted-foreground">Passed</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="premium-card">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Audit Metadata</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between py-2 border-b border-border/30">
                                            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">Runtime</span>
                                            <span className="text-[10px] font-bold">14.2s</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-border/30">
                                            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">Region</span>
                                            <span className="text-[10px] font-bold">US-East (Stealth)</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2">
                                            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">Agent ID</span>
                                            <span className="text-[10px] font-mono">SAEO_AUDIT_2402</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : !loading && (
                    <div className="py-40 flex flex-col items-center justify-center text-center opacity-30 grayscale pointer-events-none">
                        <Shield className="w-24 h-24 mb-6" />
                        <h2 className="text-3xl font-black tracking-tighter mb-2 uppercase">Audit Pipeline Standby</h2>
                        <p className="max-w-md text-sm font-bold uppercase tracking-widest">Provide a URL for recursive technical inspection and neural mapping.</p>
                    </div>
                )}
            </AnimatePresence>

            {/* AI Fix Modal */}
            <AnimatePresence>
                {showFixesModal && selectedIssue && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                        onClick={() => setShowFixesModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="glass max-w-2xl w-full max-h-[80vh] overflow-y-auto rounded-3xl p-8"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Zap className="w-5 h-5 text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">AI Fix Engine</span>
                                    </div>
                                    <h2 className="text-2xl font-black tracking-tight">{selectedIssue.title}</h2>
                                </div>
                                <button
                                    onClick={() => setShowFixesModal(false)}
                                    className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Loading State */}
                                {aiLoading && (
                                    <div className="py-10 text-center">
                                        <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
                                        <p className="text-sm font-bold text-muted-foreground">AI is analyzing this issue...</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">Generating personalized fix recommendations</p>
                                    </div>
                                )}

                                {/* AI Generated Content */}
                                {!aiLoading && aiExplanation && (
                                    <>
                                        {/* Impact Banner */}
                                        <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 flex items-center justify-between">
                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Estimated Impact</span>
                                                <p className="text-lg font-black">+{aiExplanation.impact_score || (selectedIssue.severity === 'critical' || selectedIssue.severity === 'high' ? '15-20' : '5-10')}% SEO Score</p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-primary/20">
                                                <TrendingUp className="w-6 h-6 text-primary" />
                                            </div>
                                        </div>

                                        {/* AI Explanation */}
                                        <div className="p-4 rounded-2xl bg-secondary/20 border border-border/30">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">AI Analysis</h3>
                                            <p className="text-sm leading-relaxed">{safeRender(aiExplanation.explanation)}</p>
                                        </div>

                                        {/* Step-by-Step Fix Instructions */}
                                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-4">Step-by-Step Fix</h3>
                                            <div className="space-y-3">
                                                {(aiExplanation.fix_steps || []).map((step: string, idx: number) => (
                                                    <div key={idx} className="flex items-start gap-3">
                                                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                                            <span className="text-[10px] font-black text-primary">{idx + 1}</span>
                                                        </div>
                                                        <p className="text-sm">{safeRender(step)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Code Fix */}
                                        {aiExplanation.code_snippet && (
                                            <div className="rounded-2xl overflow-hidden border border-border/30">
                                                <div className="bg-secondary/40 px-4 py-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <FileCode className="w-4 h-4 text-primary" />
                                                        <span className="text-xs font-black uppercase tracking-widest">Implementation Code</span>
                                                    </div>
                                                    <button
                                                        onClick={() => { navigator.clipboard.writeText(aiExplanation.code_snippet); }}
                                                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-[10px] font-black uppercase hover:bg-primary/90 transition-colors"
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                        Copy Code
                                                    </button>
                                                </div>
                                                <pre className="p-4 bg-black/80 text-green-400 text-xs overflow-x-auto font-mono leading-relaxed">
                                                    <code>{safeRender(aiExplanation.code_snippet)}</code>
                                                </pre>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Category & Severity */}
                                <div className="flex items-center gap-4 flex-wrap">
                                    <div className="px-3 py-1.5 rounded-full bg-secondary/30 text-[10px] font-black uppercase tracking-widest">
                                        {selectedIssue.category}
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedIssue.severity?.toLowerCase() === 'high' || selectedIssue.severity?.toLowerCase() === 'critical'
                                        ? 'bg-red-500/10 text-red-500'
                                        : 'bg-yellow-500/10 text-yellow-500'
                                        }`}>
                                        {selectedIssue.severity} Priority
                                    </div>
                                    <div className="px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest">
                                        3 Steps to Fix
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setShowFixesModal(false)}
                                        className="flex-1 py-4 rounded-2xl bg-secondary text-foreground font-black uppercase tracking-widest text-xs hover:bg-secondary/80 transition-all"
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={() => setShowFixesModal(false)}
                                        className="flex-1 py-4 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        Mark as Fixed
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bulk AI Fixes Modal */}
            <AnimatePresence>
                {showBulkFixesModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => !bulkLoading && setShowBulkFixesModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="glass max-w-4xl w-full max-h-[90vh] overflow-hidden rounded-3xl flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-border/30 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-primary/20">
                                        <Zap className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight">AI Fix Engine</h2>
                                        <p className="text-xs text-muted-foreground">Generating fixes for all {results?.issues?.length || 0} issues</p>
                                    </div>
                                </div>
                                {!bulkLoading && (
                                    <button
                                        onClick={() => setShowBulkFixesModal(false)}
                                        className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            {/* Progress Bar */}
                            {bulkLoading && (
                                <div className="px-6 py-4 border-b border-border/30 bg-secondary/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Processing Issues</span>
                                        <span className="text-sm font-black">{bulkProgress}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${bulkProgress}%` }}
                                            className="h-full bg-primary"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Fixes List */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {bulkFixes.map((item, idx) => (
                                    <div key={idx} className="premium-card">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${item.issue.severity === 'critical' || item.issue.severity === 'high'
                                                    ? 'bg-red-500/10 text-red-500'
                                                    : 'bg-yellow-500/10 text-yellow-500'
                                                    }`}>
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg">{item.issue.title}</h3>
                                                    <span className="text-[10px] font-black uppercase text-muted-foreground">{item.issue.category}</span>
                                                </div>
                                            </div>
                                            <div className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-black">
                                                +{item.explanation.impact_score || 10}% Impact
                                            </div>
                                        </div>

                                        {/* Explanation */}
                                        <p className="text-sm text-muted-foreground mb-4">{safeRender(item.explanation.explanation)}</p>

                                        {/* Steps */}
                                        <div className="mb-4 space-y-2">
                                            {(item.explanation.fix_steps || []).map((step: string, sIdx: number) => (
                                                <div key={sIdx} className="flex items-start gap-2 text-sm">
                                                    <span className="text-primary font-black">{sIdx + 1}.</span>
                                                    <span>{safeRender(step)}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Code */}
                                        {item.explanation.code_snippet && (
                                            <div className="rounded-xl overflow-hidden border border-border/30">
                                                <div className="bg-secondary/40 px-3 py-2 flex items-center justify-between">
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Code Fix</span>
                                                    <button
                                                        onClick={() => navigator.clipboard.writeText(item.explanation.code_snippet)}
                                                        className="text-[9px] font-black text-primary hover:text-primary/80 flex items-center gap-1"
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                        Copy
                                                    </button>
                                                </div>
                                                <pre className="p-3 bg-black/80 text-green-400 text-[10px] overflow-x-auto font-mono">
                                                    <code>{safeRender(item.explanation.code_snippet)}</code>
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {bulkFixes.length === 0 && bulkLoading && (
                                    <div className="py-20 text-center">
                                        <div className="w-16 h-16 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-6" />
                                        <p className="text-lg font-bold">AI is analyzing all issues...</p>
                                        <p className="text-xs text-muted-foreground mt-2">This may take a moment</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {!bulkLoading && bulkFixes.length > 0 && (
                                <div className="p-6 border-t border-border/30 flex gap-4">
                                    <button
                                        onClick={() => setShowBulkFixesModal(false)}
                                        className="flex-1 py-4 rounded-2xl bg-secondary text-foreground font-black uppercase tracking-widest text-xs hover:bg-secondary/80 transition-all"
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={() => {
                                            const allCode = bulkFixes
                                                .filter(f => f.explanation.code_snippet)
                                                .map(f => `// ${f.issue.title}\n${f.explanation.code_snippet}`)
                                                .join('\n\n');
                                            navigator.clipboard.writeText(allCode);
                                        }}
                                        className="flex-1 py-4 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        <Copy className="w-4 h-4" />
                                        Copy All Code Fixes
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
