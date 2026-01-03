import { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Target,
    Zap,
    SearchCode,
    PieChart,
    MousePointer2,
    Layers,
    X,
    Globe,
    Cpu,
    ArrowRight,
    RefreshCw
} from 'lucide-react';
import api from '../../lib/api';

import { useDashboard } from '../../contexts/DashboardContext';

export const KeywordTools = () => {
    const { state, setKeywordState } = useDashboard();
    const [keyword, setKeyword] = useState(state.keywords.input);
    const [mode, setMode] = useState<'discover' | 'analyze'>(state.keywords.mode);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(state.keywords.results[state.keywords.mode]);
    const [selectedKeyword, setSelectedKeyword] = useState<any>(null);

    // Keyword Response Cache
    const [keywordCache, setKeywordCache] = useState<Map<string, any>>(new Map());

    // Sync results when mode changes
    useEffect(() => {
        setResults(state.keywords.results[mode]);
    }, [mode, state.keywords.results]);

    // Handle Deep Analysis Trigger
    useEffect(() => {
        const triggerDeepAnalysis = async () => {
            if (mode === 'analyze' && keyword && !loading && !results) {
                const cacheKey = getCacheKey(keyword, 'analyze');
                if (!keywordCache.has(cacheKey)) {
                    // Trigger handleSearch if not in cache (simulating search form)
                    const fakeEvent = { preventDefault: () => { } } as FormEvent;
                    handleSearch(fakeEvent);
                }
            }
        };
        triggerDeepAnalysis();
    }, [mode]);

    // Helper to get cache key
    const getCacheKey = (kw: string, m: 'discover' | 'analyze') => `${kw.toLowerCase()}-${m}`;

    // Helper to update cache
    const updateCache = (kw: string, m: 'discover' | 'analyze', data: any) => {
        setKeywordCache(prev => {
            const newCache = new Map(prev);
            newCache.set(getCacheKey(kw, m), data);
            return newCache;
        });
    };

    const handleSearch = async (e: FormEvent) => {
        e.preventDefault();
        if (!keyword) return;

        const cacheKey = getCacheKey(keyword, mode);

        // Check cache first
        if (keywordCache.has(cacheKey)) {
            const cachedData = keywordCache.get(cacheKey);
            setResults(cachedData);
            setKeywordState(cachedData, keyword, mode);
            return;
        }

        setLoading(true);
        try {
            const endpoint = mode === 'discover' ? '/keywords/discover' : '/keywords/analyze';
            const payload = mode === 'discover' ? { seed_keyword: keyword } : { keyword };
            const response = await api.post(endpoint, payload);
            const data = response.data.data;
            setResults(data);
            setKeywordState(data, keyword, mode);
            updateCache(keyword, mode, data);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getDifficultyColor = (difficulty: string | number) => {
        if (typeof difficulty === 'number') {
            if (difficulty < 30) return 'text-green-500 bg-green-500/10 border-green-500/20';
            if (difficulty < 70) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            return 'text-red-500 bg-red-500/10 border-red-500/20';
        }
        const diff = difficulty?.toLowerCase();
        if (diff === 'easy') return 'text-green-500 bg-green-500/10 border-green-500/20';
        if (diff === 'medium') return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
        return 'text-red-500 bg-red-500/10 border-red-500/20';
    };

    return (
        <div className="space-y-10">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/40 pb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter mb-2">Keywords</h1>
                    <p className="text-muted-foreground font-medium flex items-center gap-2">
                        <SearchCode className="w-4 h-4 text-primary" />
                        Analyzing global keyword clusters and commercial intent.
                    </p>
                </div>
                <div className="flex bg-secondary/30 p-1 rounded-2xl border border-border/50">
                    <button
                        onClick={() => setMode('discover')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${mode === 'discover' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:bg-secondary'}`}
                    >
                        DISCOVER
                    </button>
                    <button
                        onClick={() => setMode('analyze')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${mode === 'analyze' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:bg-secondary'}`}
                    >
                        ANALYZE
                    </button>
                </div>
            </div>

            {/* Search Input */}
            <div className="glass rounded-3xl p-1 shadow-2xl shadow-primary/5 max-w-2xl mx-auto">
                <form onSubmit={handleSearch} className="flex items-center gap-2 p-1.5">
                    <div className="relative flex-1">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder={mode === 'discover' ? "Seed keyword (e.g. AI Marketing)" : "Analyze specific keyword"}
                            required
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
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
                                <span>Fetch</span>
                                <Cpu className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>
            </div>

            <AnimatePresence mode="wait">
                {results && mode === 'discover' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-xl font-black flex items-center gap-2">
                                <Target className="w-5 h-5 text-primary" />
                                <span>Discovery Matrix</span>
                            </h2>
                        </div>

                        <div className="premium-card !p-0 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-secondary/20 border-b border-border/50">
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Keyword</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Volume</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Difficulty</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Intent</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground shrink-0 w-20"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.keywords?.map((kw: any, i: number) => (
                                        <tr key={i} className="border-b border-border/20 hover:bg-secondary/10 transition-colors group">
                                            <td className="p-6 font-bold text-sm tracking-tight">{kw.keyword}</td>
                                            <td className="p-6">
                                                <span className="text-[10px] px-3 py-1 rounded-full bg-secondary text-foreground/80 font-black uppercase tracking-wider">
                                                    {kw.search_volume_estimate || 'Medium'}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase border tracking-tighter ${getDifficultyColor(kw.difficulty)}`}>
                                                    {kw.difficulty || 'Easy'}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                    <MousePointer2 className="w-3 h-3 text-primary" />
                                                    <span>{kw.intent || 'Info'}</span>
                                                </div>
                                            </td>
                                            <td className="p-6 text-right">
                                                <button
                                                    onClick={() => setSelectedKeyword(kw)}
                                                    className="p-2 hover:bg-primary/20 rounded-xl text-primary transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <ArrowRight className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {results && mode === 'analyze' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-1 space-y-6">
                            <div className="premium-card">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Volume Pulse</h3>
                                <div className="text-4xl font-black mb-1 tracking-tighter">{results.search_volume_estimate?.toLocaleString() || 'N/A'}</div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-primary">Monthly Potential</div>
                            </div>

                            <div className="premium-card">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Complexity Index</h3>
                                <div className="flex items-end justify-between mb-4">
                                    <div className="text-4xl font-black tracking-tighter">{results.difficulty_score || '0'}</div>
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${getDifficultyColor(results.difficulty_score || 0)}`}>
                                        {results.difficulty_score < 30 ? 'EASY' : results.difficulty_score < 70 ? 'MODERATE' : 'COMPLEX'}
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <div className={`h-full bg-primary transition-all duration-1000`} style={{ width: `${results.difficulty_score || 0}%` }} />
                                </div>
                            </div>

                            <div className="premium-card">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Yield Variance</h3>
                                <div className="text-4xl font-black mb-1 tracking-tighter">${results.cpc_estimate?.toFixed(2) || '0.00'}</div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-green-500">Avg. Cost Per Click</div>
                            </div>
                        </div>

                        <div className="lg:col-span-3 space-y-8">
                            <div className="premium-card">
                                <h2 className="text-xl font-black mb-8 tracking-tight flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-primary" />
                                    Search Ecosystem Analysis
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                                    {(results.serp_features_likely || ['Snippets', 'Charts', 'PAA Index']).map((f: string, i: number) => (
                                        <div key={i} className="p-4 rounded-2xl bg-secondary/20 border border-border/30 flex items-center gap-3">
                                            <Zap className="w-4 h-4 text-yellow-500 fill-current" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{f}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-6 rounded-3xl bg-primary/5 border border-primary/20">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">AI Strategic Recommendation</h4>
                                    <p className="text-xs font-medium text-muted-foreground leading-relaxed italic">
                                        "{results.ranking_difficulty_explanation || 'No deep strategy mapped yet. Run discovery for intent clusters.'}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {!loading && !results && (
                    <div className="py-40 flex flex-col items-center justify-center text-center opacity-30 grayscale pointer-events-none">
                        <PieChart className="w-24 h-24 mb-6" />
                        <h2 className="text-3xl font-black tracking-tighter mb-2 uppercase">Market Data Standby</h2>
                        <p className="max-w-md text-sm font-bold uppercase tracking-widest">Global semantic trends engine ready for synchronization.</p>
                    </div>
                )}
            </AnimatePresence>

            {/* Strategy Modal Placeholder */}
            {selectedKeyword && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/90 backdrop-blur-xl" onClick={() => setSelectedKeyword(null)} />
                    <div className="relative w-full max-w-lg glass border border-border rounded-3xl p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black tracking-tight">{selectedKeyword.keyword}</h3>
                            <button onClick={() => setSelectedKeyword(null)}><X className="w-6 h-6" /></button>
                        </div>
                        <div className="space-y-6">
                            <div className="premium-card bg-primary/5 border-primary/20">
                                <p className="text-xs font-medium leading-relaxed italic">"{selectedKeyword.strategy || 'Optimize for information density to capture the PAA slot.'}"</p>
                            </div>
                            <button
                                onClick={() => {
                                    setMode('analyze');
                                    setKeyword(selectedKeyword.keyword);
                                    setSelectedKeyword(null);
                                    // The useEffect above will handle the automatic trigger
                                }}
                                className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
                            >
                                <Zap className="w-4 h-4" />
                                Deep Analysis
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
