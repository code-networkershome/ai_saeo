import { useState, useEffect, type FormEvent } from 'react';
import {
    TrendingUp,
    Globe,
    Link2,
    Search,
    Target,
    ArrowUpRight,
    ArrowDownRight,
    Sparkles,
    RefreshCw,
    ExternalLink,
    ShieldCheck,
    Lock,
    Cpu,
    Loader2,
    CheckCircle2,
    AlertCircle,
    X,
    Database,
    Zap,
} from 'lucide-react';

import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import api from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '../../contexts/DashboardContext';

// GSC Connection Prompt Modal
const GSCPromptModal = ({ isOpen, onClose, onConnect }: { isOpen: boolean; onClose: () => void; onConnect: () => void }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative w-full max-w-md p-8 bg-background border border-border/50 rounded-3xl shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-xl hover:bg-secondary transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                            <Database className="w-8 h-8 text-white" />
                        </div>

                        <h2 className="text-2xl font-black tracking-tight mb-2">Unlock Real Data</h2>
                        <p className="text-muted-foreground mb-6">
                            Connect Google Search Console to see <span className="text-primary font-bold">real keywords</span>,
                            <span className="text-primary font-bold"> actual traffic</span>, and <span className="text-primary font-bold">true rankings</span> for your domain.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={onConnect}
                                className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                Connect Google Search Console
                            </button>

                            <button
                                onClick={onClose}
                                className="w-full py-3 px-6 bg-secondary/50 text-muted-foreground rounded-xl font-bold uppercase tracking-widest hover:bg-secondary transition-all flex items-center justify-center gap-2"
                            >
                                <Zap className="w-4 h-4" />
                                Continue with AI Estimates
                            </button>
                        </div>

                        <p className="text-[10px] text-muted-foreground mt-4 uppercase tracking-widest">
                            AI estimates are based on industry benchmarks and may differ from actual data
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// Data Source Badge
const DataSourceBadge = ({ source }: { source: 'gsc' | 'estimated' | 'duckduckgo' }) => {
    if (source === 'gsc') {
        return (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full">
                <Database className="w-3 h-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">Real Data</span>
            </div>
        );
    }
    if (source === 'duckduckgo') {
        return (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full">
                <Search className="w-3 h-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">Live SERP</span>
            </div>
        );
    }
    return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full">
            <Zap className="w-3 h-3" />
            <span className="text-[9px] font-black uppercase tracking-widest">AI Estimated</span>
        </div>
    );
};

// Loading skeleton component for charts
const ChartSkeleton = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="premium-card animate-pulse">
        <div className="flex items-center justify-between mb-6">
            <div>
                <h3 className="text-xl font-black tracking-tight">{title}</h3>
                {subtitle && <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2 text-primary">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest">Generating...</span>
            </div>
        </div>
        <div className="h-64 bg-gradient-to-br from-secondary/50 to-secondary/20 rounded-2xl flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-primary/50" />
                </div>
                <p className="text-sm font-bold text-muted-foreground">Analyzing data...</p>
            </div>
        </div>
    </div>
);

// Status indicator for sections
const SectionStatus = ({ status }: { status: 'loading' | 'ready' | 'error' }) => {
    if (status === 'loading') {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest">Generating</span>
            </div>
        );
    }
    if (status === 'ready') {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                <span className="text-[10px] font-black uppercase tracking-widest">Ready</span>
            </div>
        );
    }
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full">
            <AlertCircle className="w-3 h-3" />
            <span className="text-[10px] font-black uppercase tracking-widest">Unavailable</span>
        </div>
    );
};

export const AnalyticsDashboard = () => {
    const { state, setAnalyticsState } = useDashboard();
    const [domain, setDomain] = useState(state.analytics.input);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(state.analytics.results);
    const [googleStatus, setGoogleStatus] = useState({ is_connected: false, is_configured: false });
    const [checkLoading, setCheckLoading] = useState(true);
    const [showGSCPrompt, setShowGSCPrompt] = useState(false);

    useEffect(() => {
        const checkGoogle = async () => {
            try {
                const response = await api.get('/auth/google/status');
                setGoogleStatus(response.data);
            } catch (err) {
                console.error("Failed to check Google status", err);
            } finally {
                setCheckLoading(false);
            }
        };
        checkGoogle();
    }, []);

    const handleConnectGoogle = () => {
        window.location.href = `${api.defaults.baseURL}/auth/google/login`;
    };

    const handleAnalyze = async (e: FormEvent) => {
        e.preventDefault();
        if (!domain) return;

        setLoading(true);
        setData(null); // Clear previous data

        try {
            const response = await api.post('/analytics/full', { domain });
            const analyticsData = response.data.data;
            setData(analyticsData);
            setAnalyticsState(analyticsData, domain);

            // Show GSC prompt if not connected (only show once per session)
            if (analyticsData.gsc_status === 'not_connected' && !sessionStorage.getItem('gsc_prompt_shown')) {
                setShowGSCPrompt(true);
                sessionStorage.setItem('gsc_prompt_shown', 'true');
            }
        } catch (err) {
            console.error('Analytics fetch failed', err);
        } finally {
            setLoading(false);
        }
    };

    // Check if specific data section is available
    const hasData = (key: string) => data && data[key] && (Array.isArray(data[key]) ? data[key].length > 0 : Object.keys(data[key]).length > 0);
    const getStatus = (key: string): 'loading' | 'ready' | 'error' => {
        if (loading) return 'loading';
        if (hasData(key)) return 'ready';
        return data ? 'error' : 'loading';
    };

    const MetricCard = ({ title, value, change, icon: Icon, colorClass, isLoading }: any) => (
        <div className="premium-card relative overflow-hidden">
            {isLoading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
            )}
            <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${colorClass} bg-opacity-10`}>
                    <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
                </div>
                {change && !isLoading && (
                    <div className={`flex items-center space-x-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${change.startsWith('+') || change.startsWith('-') === false
                        ? 'text-green-500 bg-green-500/10 border-green-500/20'
                        : 'text-red-500 bg-red-500/10 border-red-500/20'
                        }`}>
                        {change.startsWith('+') || !change.startsWith('-') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        <span>{change}</span>
                    </div>
                )}
            </div>
            <div className="text-3xl font-black text-foreground mb-1 tracking-tighter">
                {isLoading ? '—' : (value || 'N/A')}
            </div>
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{title}</div>
        </div>
    );

    return (
        <>
            {/* GSC Connection Prompt Modal */}
            <GSCPromptModal
                isOpen={showGSCPrompt}
                onClose={() => setShowGSCPrompt(false)}
                onConnect={handleConnectGoogle}
            />

            <div className="space-y-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/40 pb-8">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter mb-2">Web Analytics</h1>
                        <p className="text-muted-foreground font-medium flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-primary" />
                            Live domain authority and SERP ecosystem analysis.
                        </p>
                    </div>

                    {!checkLoading && (
                        <div className={`flex items-center space-x-4 p-4 rounded-2xl border transition-all ${googleStatus.is_connected ? 'bg-green-500/5 border-green-500/20' : 'bg-primary/5 border-primary/20'}`}>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Google Integration</span>
                                <span className={`text-xs font-bold ${googleStatus.is_connected ? 'text-green-500' : 'text-primary'}`}>
                                    {googleStatus.is_connected ? 'Connected to Search Console' : 'GSC Authentication Required'}
                                </span>
                            </div>
                            {googleStatus.is_connected ? (
                                <div className="p-2 rounded-xl bg-green-500/20 text-green-500">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                            ) : (
                                <button
                                    onClick={handleConnectGoogle}
                                    className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                                >
                                    <Lock className="w-3 h-3" />
                                    Connect
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Domain Input */}
                <div className="glass rounded-3xl p-1 shadow-2xl shadow-primary/5 max-w-2xl mx-auto">
                    <form onSubmit={handleAnalyze} className="flex items-center gap-2 p-1.5">
                        <div className="relative flex-1">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Enter target domain or URL..."
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
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
                                    <span>Compute</span>
                                    <TrendingUp className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Show content when loading OR when data is available */}
                {(loading || data) ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">

                        {/* Main Metrics Grid - Always show with loading state */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <MetricCard
                                icon={Target}
                                title="Authority Score"
                                value={data?.summary_metrics?.authority_score}
                                colorClass="bg-indigo-500"
                                isLoading={loading}
                            />
                            <MetricCard
                                icon={TrendingUp}
                                title="Est. Monthly Traffic"
                                value={data?.summary_metrics?.organic_traffic}
                                colorClass="bg-emerald-500"
                                isLoading={loading}
                            />
                            <MetricCard
                                icon={Search}
                                title="Ranked Keywords"
                                value={data?.summary_metrics?.organic_keywords}
                                colorClass="bg-violet-500"
                                isLoading={loading}
                            />
                            <MetricCard
                                icon={Link2}
                                title="Referring Domains"
                                value={data?.summary_metrics?.referring_domains?.toLocaleString?.() || data?.summary_metrics?.referring_domains}
                                colorClass="bg-amber-500"
                                isLoading={loading}
                            />
                        </div>

                        {/* Traffic Trend Chart */}
                        <AnimatePresence mode="wait">
                            {loading && !hasData('traffic_trend') ? (
                                <ChartSkeleton title="Traffic Trend Analysis" subtitle="Processing traffic data from multiple sources" />
                            ) : hasData('traffic_trend') ? (
                                <motion.div
                                    key="traffic-chart"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="premium-card"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-xl font-black tracking-tight">Traffic Trend Analysis</h3>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                                Multi-channel traffic breakdown • Last 6 months
                                            </p>
                                        </div>
                                        <SectionStatus status={getStatus('traffic_trend')} />
                                    </div>
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={data.traffic_trend}>
                                                <defs>
                                                    <linearGradient id="organicGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="directGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="referralGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                                                <XAxis dataKey="month" stroke="#888" fontSize={11} tickLine={false} />
                                                <YAxis stroke="#888" fontSize={11} tickLine={false} tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}K`} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '12px' }}
                                                    formatter={(value: any, name: any) => [value >= 1000000 ? `${(value / 1000000).toFixed(2)}M` : `${(value / 1000).toFixed(1)}K`, name]}
                                                />
                                                <Area type="monotone" dataKey="organic" name="Organic" stroke="#22c55e" strokeWidth={2} fill="url(#organicGrad)" />
                                                <Area type="monotone" dataKey="direct" name="Direct" stroke="#6366f1" strokeWidth={2} fill="url(#directGrad)" />
                                                <Area type="monotone" dataKey="referral" name="Referral" stroke="#a855f7" strokeWidth={2} fill="url(#referralGrad)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                    {/* Legend */}
                                    <div className="flex items-center justify-center gap-8 mt-6 pt-4 border-t border-border/30">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                            <span className="text-xs font-bold">Organic</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-indigo-500" />
                                            <span className="text-xs font-bold">Direct</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-violet-500" />
                                            <span className="text-xs font-bold">Referral</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>

                        {/* Two Column Grid: Keyword Positions & Backlink Trend */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Keyword Position Changes */}
                            <AnimatePresence mode="wait">
                                {loading && !hasData('keyword_positions') ? (
                                    <ChartSkeleton title="Keyword Position Changes" subtitle="Analyzing SERP movements" />
                                ) : hasData('keyword_positions') ? (
                                    <motion.div
                                        key="keyword-chart"
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="premium-card"
                                    >
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <h3 className="text-xl font-black tracking-tight">Keyword Position Changes</h3>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                                    Daily ranking fluctuations
                                                </p>
                                            </div>
                                            <SectionStatus status={getStatus('keyword_positions')} />
                                        </div>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={data.keyword_positions}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                                                    <XAxis dataKey="date" stroke="#888" fontSize={10} tickLine={false} />
                                                    <YAxis stroke="#888" fontSize={10} tickLine={false} />
                                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }} />
                                                    <Bar dataKey="improved" name="Improved" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                                    <Bar dataKey="declined" name="Declined" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="flex items-center justify-center gap-6 mt-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                                <span className="text-xs font-bold">Improved</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                                <span className="text-xs font-bold">Declined</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : null}
                            </AnimatePresence>

                            {/* Backlink Trend */}
                            <AnimatePresence mode="wait">
                                {loading && !hasData('backlink_trend') ? (
                                    <ChartSkeleton title="Backlink Growth" subtitle="Tracking referring domain changes" />
                                ) : hasData('backlink_trend') ? (
                                    <motion.div
                                        key="backlink-chart"
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="premium-card"
                                    >
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <h3 className="text-xl font-black tracking-tight">Backlink Growth</h3>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                                    Referring domains over time
                                                </p>
                                            </div>
                                            <SectionStatus status={getStatus('backlink_trend')} />
                                        </div>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={data.backlink_trend}>
                                                    <defs>
                                                        <linearGradient id="backlinkGrad" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                                                    <XAxis dataKey="month" stroke="#888" fontSize={10} tickLine={false} />
                                                    <YAxis stroke="#888" fontSize={10} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                                                        formatter={(value: any) => [`${(value / 1000).toFixed(1)}K domains`, 'Referring']}
                                                    />
                                                    <Area type="monotone" dataKey="domains" stroke="#06b6d4" strokeWidth={2} fill="url(#backlinkGrad)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </motion.div>
                                ) : null}
                            </AnimatePresence>
                        </div>

                        {/* Authority Distribution */}
                        <AnimatePresence mode="wait">
                            {loading && !hasData('authority_distribution') ? (
                                <ChartSkeleton title="Domain Authority Distribution" subtitle="Analyzing backlink quality profile" />
                            ) : hasData('authority_distribution') ? (
                                <motion.div
                                    key="authority-chart"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="premium-card"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-xl font-black tracking-tight">Domain Authority Distribution</h3>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                                Referring domains by authority score
                                            </p>
                                        </div>
                                        <SectionStatus status={getStatus('authority_distribution')} />
                                    </div>
                                    <div className="space-y-4">
                                        {data.authority_distribution.map((item: any, i: number) => {
                                            const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'];
                                            return (
                                                <div key={item.range} className="flex items-center gap-4">
                                                    <span className="text-sm font-bold w-20 text-right font-mono">{item.range}</span>
                                                    <div className="flex-1 h-8 bg-secondary/30 rounded-lg overflow-hidden relative">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.max(item.percent, 0.5)}%` }}
                                                            transition={{ duration: 1, delay: i * 0.1 }}
                                                            className="h-full rounded-lg"
                                                            style={{ backgroundColor: colors[i] }}
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold">
                                                            {item.percent.toFixed(2)}%
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-bold text-primary w-20 text-right font-mono">
                                                        {item.count.toLocaleString()}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>

                        {/* Top Keywords Table */}
                        <AnimatePresence mode="wait">
                            {loading && !hasData('top_keywords') ? (
                                <ChartSkeleton title="Top Ranking Keywords" subtitle="Fetching keyword performance data" />
                            ) : data?.top_keywords?.length > 0 ? (
                                <motion.div
                                    key="keywords-table"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="premium-card"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-xl font-black tracking-tight">Top Ranking Keywords</h3>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">By estimated traffic contribution</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <DataSourceBadge source={data?.data_sources?.keywords === 'gsc' ? 'gsc' : 'estimated'} />
                                            <SectionStatus status="ready" />
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-border/30">
                                                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Keyword</th>
                                                    <th className="text-center py-3 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Position</th>
                                                    <th className="text-center py-3 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Volume</th>
                                                    <th className="text-center py-3 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Traffic</th>
                                                    <th className="text-center py-3 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Trend</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(data.top_keywords || []).map((kw: any, i: number) => (
                                                    <tr key={i} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                                                        <td className="py-3 px-4 font-bold text-sm">{kw.keyword}</td>
                                                        <td className="py-3 px-4 text-center">
                                                            <span className={`px-2 py-1 rounded-lg text-xs font-black ${kw.position <= 3 ? 'bg-emerald-500/10 text-emerald-500' : kw.position <= 10 ? 'bg-amber-500/10 text-amber-500' : 'bg-secondary text-muted-foreground'}`}>
                                                                #{kw.position}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-center text-sm font-bold text-muted-foreground">{kw.volume}</td>
                                                        <td className="py-3 px-4 text-center text-sm font-bold text-primary">{kw.traffic}</td>
                                                        <td className="py-3 px-4 text-center">
                                                            {kw.trend === 'up' ? (
                                                                <ArrowUpRight className="w-4 h-4 text-emerald-500 mx-auto" />
                                                            ) : kw.trend === 'down' ? (
                                                                <ArrowDownRight className="w-4 h-4 text-red-500 mx-auto" />
                                                            ) : (
                                                                <div className="w-4 h-0.5 bg-amber-500 mx-auto rounded" />
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>

                        {/* SERP Rankings & AI Visibility */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Real SERP Rankings */}
                            <div className="lg:col-span-2">
                                <AnimatePresence mode="wait">
                                    {loading && !data?.serp_rankings?.length ? (
                                        <ChartSkeleton title="Real-Time SERP Analysis" subtitle="Querying live search results" />
                                    ) : data?.serp_rankings?.length > 0 ? (
                                        <motion.div
                                            key="serp-table"
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="premium-card"
                                        >
                                            <div className="flex items-center justify-between mb-8">
                                                <div>
                                                    <h3 className="text-xl font-black tracking-tight">Real-Time SERP Analysis</h3>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Live from DuckDuckGo Global Index</p>
                                                </div>
                                                <SectionStatus status="ready" />
                                            </div>
                                            <div className="space-y-4">
                                                {data.serp_rankings.slice(0, 5).map((rank: any, i: number) => (
                                                    <div key={i} className="group p-4 rounded-2xl bg-secondary/20 border border-border/30 hover:border-primary/40 transition-all flex items-start gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center font-black text-primary border border-border/50 shrink-0">
                                                            {i + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <h4 className="font-bold truncate group-hover:text-primary transition-colors">{rank.title}</h4>
                                                                <a href={rank.url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-primary/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                                                    <ExternalLink className="w-3.5 h-3.5 text-primary" />
                                                                </a>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{rank.description}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <div className="premium-card">
                                            <div className="py-16 text-center opacity-40">
                                                <Search className="w-12 h-12 mx-auto mb-4" />
                                                <p className="text-sm font-bold uppercase tracking-widest">No SERP data available</p>
                                            </div>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* AI Visibility */}
                            <div className="space-y-8">
                                <AnimatePresence mode="wait">
                                    {loading && !hasData('ai_visibility') ? (
                                        <div className="premium-card animate-pulse">
                                            <div className="flex items-center space-x-2 mb-6">
                                                <Sparkles className="w-5 h-5 text-primary" />
                                                <h3 className="font-black tracking-tight">AI Visibility</h3>
                                            </div>
                                            <div className="space-y-4">
                                                {[1, 2, 3, 4].map((i) => (
                                                    <div key={i} className="h-8 bg-secondary/50 rounded-lg" />
                                                ))}
                                            </div>
                                        </div>
                                    ) : hasData('ai_visibility') ? (
                                        <motion.div
                                            key="ai-visibility"
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="premium-card bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5"
                                        >
                                            <div className="flex items-center space-x-2 mb-6">
                                                <Sparkles className="w-5 h-5 text-primary" />
                                                <h3 className="font-black tracking-tight">AI Visibility</h3>
                                            </div>
                                            <div className="space-y-5">
                                                {data.ai_visibility.map((platform: any, i: number) => (
                                                    <div key={i} className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm font-bold">{platform.name}</span>
                                                            <span className="text-xs font-bold text-primary">{platform.mentions?.toLocaleString?.()} mentions</span>
                                                        </div>
                                                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${Math.min((platform.mentions / 30000) * 100, 100)}%` }}
                                                                transition={{ duration: 1, delay: i * 0.1 }}
                                                                className="h-full rounded-full"
                                                                style={{ backgroundColor: platform.color }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    ) : null}
                                </AnimatePresence>

                                {/* AI Insights */}
                                {data?.ai_insights?.executive_summary && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="premium-card border-primary/20 bg-gradient-to-br from-primary/5 to-transparent"
                                    >
                                        <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-3">AI Strategy Insights</h4>
                                        <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                                            {data.ai_insights.executive_summary}
                                        </p>
                                        {data.ai_insights.priority_actions?.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-border/30">
                                                <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Priority Actions</h5>
                                                <ul className="space-y-2">
                                                    {data.ai_insights.priority_actions.slice(0, 3).map((action: string, i: number) => (
                                                        <li key={i} className="text-xs text-foreground flex items-start gap-2">
                                                            <span className="text-primary">•</span>
                                                            {action}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div className="py-40 flex flex-col items-center justify-center text-center opacity-30 grayscale pointer-events-none">
                        <TrendingUp className="w-24 h-24 mb-6" />
                        <h2 className="text-3xl font-black tracking-tighter mb-2 uppercase">Neural Pipeline Ready</h2>
                        <p className="max-w-md text-sm font-bold uppercase tracking-widest">Enter a domain above to start comprehensive analysis.</p>
                    </div>
                )}
            </div>
        </>
    );
};
