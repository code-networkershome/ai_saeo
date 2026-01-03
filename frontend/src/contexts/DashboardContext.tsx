import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface DashboardState {
    aeo: { results: any; input: string };
    audit: { results: any; input: string };
    analytics: { results: any; input: string };
    keywords: {
        input: string;
        mode: 'discover' | 'analyze';
        results: { discover: any; analyze: any };
    };
    content: {
        topic: string;
        keyword: string;
        tab: string;
        results: { brief: any; writer: any; meta: any; ideas: any };
    };
    competitors: {
        domain: string;
        competitors: string[];
        mode: 'analyze' | 'compare' | 'gaps';
        results: { analyze: any; compare: any; gaps: any };
    };
}

interface DashboardContextType {
    state: DashboardState;
    setAeoState: (results: any, input: string) => void;
    setAuditState: (results: any, input: string) => void;
    setAnalyticsState: (results: any, input: string) => void;
    setKeywordState: (results: any, input: string, mode: 'discover' | 'analyze') => void;
    setContentState: (results: any, topic: string, keyword: string, tab: string) => void;
    setCompetitorState: (results: any, domain: string, competitors: string[], mode: 'analyze' | 'compare' | 'gaps') => void;
    clearState: () => void;
}

const STORAGE_KEY = 'saeo_dashboard_state';

const initialState: DashboardState = {
    aeo: { results: null, input: '' },
    audit: { results: null, input: '' },
    analytics: { results: null, input: '' },
    keywords: {
        input: '',
        mode: 'discover',
        results: { discover: null, analyze: null }
    },
    content: {
        topic: '',
        keyword: '',
        tab: 'brief',
        results: { brief: null, writer: null, meta: null, ideas: null }
    },
    competitors: {
        domain: '',
        competitors: [],
        mode: 'analyze',
        results: { analyze: null, compare: null, gaps: null }
    }
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<DashboardState>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsedState = JSON.parse(saved);
                // Merge with initialState to ensure all properties exist
                return {
                    ...initialState,
                    ...parsedState,
                    // Deep merge nested objects
                    keywords: { ...initialState.keywords, ...parsedState.keywords },
                    content: { ...initialState.content, ...parsedState.content },
                    competitors: { ...initialState.competitors, ...parsedState.competitors },
                    analytics: parsedState.analytics || initialState.analytics,
                    aeo: parsedState.aeo || initialState.aeo,
                    audit: parsedState.audit || initialState.audit
                };
            } catch (e) {
                console.error("Failed to parse saved dashboard state", e);
            }
        }
        return initialState;
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    const setAeoState = (results: any, input: string) => {
        setState(prev => ({ ...prev, aeo: { results, input } }));
    };

    const setAuditState = (results: any, input: string) => {
        setState(prev => ({ ...prev, audit: { results, input } }));
    };

    const setAnalyticsState = (results: any, input: string) => {
        setState(prev => ({ ...prev, analytics: { results, input } }));
    };

    const setKeywordState = (results: any, input: string, mode: 'discover' | 'analyze') => {
        setState(prev => ({
            ...prev,
            keywords: {
                input,
                mode,
                results: { ...prev.keywords.results, [mode]: results || prev.keywords.results[mode] }
            }
        }));
    };

    const setContentState = (results: any, topic: string, keyword: string, tab: string) => {
        setState(prev => ({
            ...prev,
            content: {
                topic,
                keyword,
                tab,
                results: { ...prev.content.results, [tab]: results || prev.content.results[tab as keyof typeof prev.content.results] }
            }
        }));
    };

    const setCompetitorState = (results: any, domain: string, competitors: string[], mode: 'analyze' | 'compare' | 'gaps') => {
        setState(prev => ({
            ...prev,
            competitors: {
                domain,
                competitors,
                mode,
                results: { ...prev.competitors.results, [mode]: results || prev.competitors.results[mode] }
            }
        }));
    };

    const clearState = () => {
        setState(initialState);
        localStorage.removeItem(STORAGE_KEY);
    };

    return (
        <DashboardContext.Provider value={{ state, setAeoState, setAuditState, setAnalyticsState, setKeywordState, setContentState, setCompetitorState, clearState }}>
            {children}
        </DashboardContext.Provider>
    );
};

export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
};
