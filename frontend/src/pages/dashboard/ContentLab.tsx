import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PenTool,
    FileText,
    Layout,
    Sparkles,
    Copy,
    Download,
    RefreshCw,
    Zap,
    Target,
    AlertCircle,
    Cpu,
    ChevronRight,
    SearchCode,
    Activity
} from 'lucide-react';
import api from '../../lib/api';

import { useDashboard } from '../../contexts/DashboardContext';

type Tab = 'brief' | 'writer' | 'meta' | 'ideas';

export const ContentLab = () => {
    const { state, setContentState } = useDashboard();
    const [activeTab, setActiveTab] = useState<Tab>(state.content.tab as Tab);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<any>(state.content.results[state.content.tab as keyof typeof state.content.results]);

    // Content Generation Cache
    const [contentCache, setContentCache] = useState<Map<string, any>>(new Map());

    // Sync results when tab changes
    useEffect(() => {
        setResults(state.content.results[activeTab as keyof typeof state.content.results]);
    }, [activeTab, state.content.results]);

    const [searchParams] = useSearchParams();

    // Form states
    const [topic, setTopic] = useState(searchParams.get('topic') || state.content.topic);
    const [keyword, setKeyword] = useState(state.content.keyword);
    const [contentType, setContentType] = useState('blog_post');

    // Handle external state updates (e.g. from Keyword Strategy)
    useEffect(() => {
        if (state.content.topic !== topic) setTopic(state.content.topic);
        if (state.content.keyword !== keyword) setKeyword(state.content.keyword);
    }, [state.content.topic, state.content.keyword]);

    // Handle URL params
    useEffect(() => {
        const urlTopic = searchParams.get('topic');
        if (urlTopic && urlTopic !== topic) {
            setTopic(urlTopic);
        }
    }, [searchParams]);

    // Helper to get cache key
    const getCacheKey = (t: string, k: string, tab: Tab, ct?: string) => {
        // Different tabs need different inputs
        if (tab === 'meta') {
            // Meta only needs keyword
            return `meta-${k.toLowerCase()}`;
        }
        if (tab === 'ideas') {
            // Ideas only needs topic
            return `ideas-${t.toLowerCase()}`;
        }
        // Brief and writer need both
        const base = `${t.toLowerCase()}-${k.toLowerCase()}-${tab}`;
        return tab === 'brief' ? `${base}-${ct}` : base;
    };

    // Helper to update cache
    const updateCache = (t: string, k: string, tab: Tab, data: any, ct?: string) => {
        setContentCache(prev => {
            const newCache = new Map(prev);
            newCache.set(getCacheKey(t, k, tab, ct), data);
            return newCache;
        });
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();

        const cacheKey = getCacheKey(topic, keyword, activeTab, contentType);

        // Check cache first
        if (contentCache.has(cacheKey)) {
            const cachedData = contentCache.get(cacheKey);
            setResults(cachedData);
            setContentState(cachedData, topic, keyword, activeTab);
            return;
        }

        setLoading(true);
        setError(null);
        setResults(null);

        try {
            let endpoint = '';
            let payload = {};

            switch (activeTab) {
                case 'brief':
                    endpoint = '/content/brief';
                    payload = { topic, target_keyword: keyword, content_type: contentType };
                    break;
                case 'writer':
                    endpoint = '/content/create';
                    payload = { topic, keyword, word_count: 1500 };
                    break;
                case 'meta':
                    endpoint = '/content/meta';
                    payload = { keyword, count: 5 };
                    break;
                case 'ideas':
                    endpoint = '/content/ideas';
                    payload = { topic, count: 10 };
                    break;
            }

            const response = await api.post(endpoint, payload);
            const data = response.data.data;
            setResults(data);
            setContentState(data, topic, keyword, activeTab);
            updateCache(topic, keyword, activeTab, data, contentType);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Generation failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/40 pb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter mb-2">Content Lab</h1>
                    <p className="text-muted-foreground font-medium flex items-center gap-2">
                        <PenTool className="w-4 h-4 text-primary" />
                        Recursively generating high-density semantic assets.
                    </p>
                </div>

                <div className="flex bg-secondary/30 p-1 rounded-2xl border border-border/50 overflow-x-auto">
                    {(['brief', 'writer', 'meta', 'ideas'] as Tab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {
                                setActiveTab(tab);
                                setContentState(null, topic, keyword, tab);
                                setError(null);
                            }}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:bg-secondary'}`}
                        >
                            {tab.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Controls */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="premium-card">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-8 flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-primary" />
                            Engine Parameters
                        </h3>
                        <form onSubmit={handleGenerate} className="space-y-6">
                            {(activeTab === 'brief' || activeTab === 'writer' || activeTab === 'ideas') && (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Target Topic</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Quantum SEO"
                                        required
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        className="w-full bg-secondary/10 border border-border/40 rounded-2xl py-3 px-5 text-sm font-bold focus:border-primary outline-none transition-all"
                                    />
                                </div>
                            )}
                            {(activeTab === 'brief' || activeTab === 'writer' || activeTab === 'meta') && (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Primary Keyword</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. ai agent"
                                        required
                                        value={keyword}
                                        onChange={(e) => setKeyword(e.target.value)}
                                        className="w-full bg-secondary/10 border border-border/40 rounded-2xl py-3 px-5 text-sm font-bold focus:border-primary outline-none transition-all"
                                    />
                                </div>
                            )}
                            {activeTab === 'brief' && (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Asset Format</label>
                                    <select
                                        value={contentType}
                                        onChange={(e) => setContentType(e.target.value)}
                                        className="w-full bg-secondary/10 border border-border/40 rounded-2xl py-3 px-5 text-sm font-bold focus:border-primary outline-none transition-all appearance-none"
                                    >
                                        <option value="blog_post">Technical Breakdown</option>
                                        <option value="landing_page">High-Conversion Landings</option>
                                        <option value="white_paper">Industry Authority Paper</option>
                                        <option value="case_study">Proof-of-Value Study</option>
                                    </select>
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                            >
                                {loading ? (
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <span>Initialize Generation</span>
                                        <Zap className="w-4 h-4 fill-current" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="premium-card bg-primary/5 border-primary/20">
                        <div className="flex items-center gap-2 text-primary mb-4">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Growth Vector</span>
                        </div>
                        <p className="text-xs font-medium text-muted-foreground leading-relaxed italic">
                            {activeTab === 'brief' && "A high-density brief increases ranking probability by 34% through semantic grouping."}
                            {activeTab === 'writer' && "Generating at 1500+ words ensures deep topical authority in technical niches."}
                            {activeTab === 'meta' && "Optimizing for click-through pulse while maintaining character limits."}
                            {activeTab === 'ideas' && "Recursive ideation build a clusters that dominate search intent."}
                        </p>
                    </div>
                </div>

                {/* Workspace */}
                <div className="lg:col-span-2">
                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-3 mb-8">
                                <AlertCircle className="w-5 h-5" />
                                <p className="text-xs font-black uppercase tracking-widest">{error}</p>
                            </motion.div>
                        )}

                        {results ? (
                            <motion.div key={`${activeTab}-results`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                                {activeTab === 'brief' && (
                                    <div className="premium-card space-y-10">
                                        <div className="flex items-center justify-between border-b border-border/40 pb-8">
                                            <h2 className="text-2xl font-black tracking-tight">{results.title || "Blueprint Output"}</h2>
                                            <div className="flex gap-2">
                                                <button onClick={() => copyToClipboard(JSON.stringify(results, null, 2))} className="p-3 hover:bg-secondary rounded-2xl transition-all border border-border/50"><Copy className="w-4 h-4 text-muted-foreground" /></button>
                                                <button className="p-3 hover:bg-secondary rounded-2xl transition-all border border-border/50"><Download className="w-4 h-4 text-muted-foreground" /></button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                                    <Activity className="w-4 h-4" />
                                                    <span>Semantic Narrative</span>
                                                </h3>
                                                <div className="p-6 rounded-3xl bg-secondary/10 border border-border/30 italic text-xs leading-relaxed text-muted-foreground">
                                                    "{results.meta_description}"
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                                    <Target className="w-4 h-4" />
                                                    <span>Entity Mapping</span>
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {(results.semantic_keywords || []).map((kw: string, i: number) => (
                                                        <span key={i} className="text-[9px] px-3 py-1 rounded-full bg-primary/10 text-primary font-black uppercase border border-primary/20 tracking-tighter">{kw}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                                <Layout className="w-4 h-4" />
                                                <span>Structural Blueprint</span>
                                            </h3>
                                            <div className="space-y-4">
                                                {(results.outline || []).map((section: any, i: number) => (
                                                    <div key={i} className="p-6 rounded-3xl bg-background border border-border/40 group hover:border-primary/30 transition-all">
                                                        <div className="flex items-center gap-4 mb-4">
                                                            <span className="w-8 h-8 flex items-center justify-center rounded-xl bg-secondary text-[11px] font-black">{i + 1}</span>
                                                            <h4 className="font-bold text-sm tracking-tight">{section.section}</h4>
                                                        </div>
                                                        <ul className="pl-12 space-y-2">
                                                            {(section.points || []).map((point: string, j: number) => (
                                                                <li key={j} className="text-[11px] text-muted-foreground leading-relaxed flex items-center gap-2">
                                                                    <div className="w-1 h-1 rounded-full bg-primary/40 shrink-0" />
                                                                    {point}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'writer' && (
                                    <div className="premium-card">
                                        <div className="flex items-center justify-between mb-8 border-b border-border/40 pb-6">
                                            <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                                <span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> {results.word_count} TOKENS</span>
                                                <span className="flex items-center gap-2"><Target className="w-3.5 h-3.5" /> {results.keyword_density?.toFixed(1)}% DENSITY</span>
                                            </div>
                                            <button onClick={() => copyToClipboard(results.content)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors">
                                                <Copy className="w-4 h-4" /> Export Draft
                                            </button>
                                        </div>
                                        <div className="prose prose-invert max-w-none">
                                            <div className="whitespace-pre-wrap text-base leading-loose text-foreground/80 font-serif px-4">
                                                {results.content}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'meta' && (
                                    <div className="grid grid-cols-1 gap-4">
                                        {(Array.isArray(results) ? results : []).map((meta: any, i: number) => (
                                            <div key={i} className="premium-card !p-6 hover:border-primary/50 group transition-all">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Variance {i + 1}</span>
                                                    <button onClick={() => copyToClipboard(meta.description || meta.title)} className="opacity-0 group-hover:opacity-100 transition-opacity"><Copy className="w-4 h-4 text-primary" /></button>
                                                </div>
                                                <p className="text-sm font-bold tracking-tight mb-4 leading-relaxed">{meta.title || meta.description}</p>
                                                <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                                                    <span>{meta.length} CHARS</span>
                                                    {meta.has_cta && <span className="text-primary">CTA DETECTED</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'ideas' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {(Array.isArray(results) ? results : []).map((idea: any, i: number) => (
                                            <div key={i} className="premium-card flex flex-col justify-between hover:border-primary/50 group transition-all min-h-[240px]">
                                                <div>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">
                                                            {idea.type}
                                                        </span>
                                                        <SearchCode className="w-4 h-4 text-muted-foreground/30" />
                                                    </div>
                                                    <h4 className="font-black text-lg leading-tight mb-4 group-hover:text-primary transition-colors">{idea.title}</h4>
                                                    <p className="text-xs font-medium text-muted-foreground leading-relaxed italic">"{idea.angle}"</p>
                                                </div>
                                                <div className="pt-6 mt-6 border-t border-border/40 flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] font-black uppercase text-muted-foreground/60 mb-1">Target</span>
                                                        <span className="text-[10px] font-black uppercase truncate max-w-[120px]">{idea.target_audience}</span>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => {
                                                                setTopic(idea.title);
                                                                setKeyword(idea.suggested_keyword || idea.title);
                                                                setActiveTab('brief');
                                                                setResults(null);
                                                            }}
                                                            className="p-2.5 rounded-xl border border-border/40 hover:bg-primary hover:text-white transition-all"
                                                        ><ChevronRight className="w-4 h-4" /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        ) : !loading && (
                            <div className="py-40 flex flex-col items-center justify-center text-center opacity-30 grayscale pointer-events-none">
                                <PenTool className="w-24 h-24 mb-6" />
                                <h2 className="text-3xl font-black tracking-tighter mb-2 uppercase">Lab Pipeline Standby</h2>
                                <p className="max-w-md text-sm font-bold uppercase tracking-widest">Input semantic targets to initialize asset manufacturing.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
