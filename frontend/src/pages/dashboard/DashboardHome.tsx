import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    BarChart3,
    Eye,
    Search,
    KeyRound,
    FileText,
    Users,
    ArrowRight,
    Sparkles,
    Zap,
    Brain,
    Target,
    TrendingUp
} from 'lucide-react';

const features = [
    {
        id: 'analytics',
        title: 'Web Analytics',
        description: 'Comprehensive SEO metrics and AI-powered strategic insights for any domain.',
        icon: BarChart3,
        path: '/dashboard/analytics'
    },
    {
        id: 'visibility',
        title: 'AI Visibility',
        description: 'Track brand visibility across AI platforms like ChatGPT, Claude, and Gemini.',
        icon: Eye,
        path: '/dashboard/visibility'
    },
    {
        id: 'audit',
        title: 'SEO Audit',
        description: 'Deep technical SEO analysis with actionable fix recommendations.',
        icon: Search,
        path: '/dashboard/audit'
    },
    {
        id: 'keywords',
        title: 'Keywords',
        description: 'Discover high-value keywords and analyze search intent.',
        icon: KeyRound,
        path: '/dashboard/keywords'
    },
    {
        id: 'content',
        title: 'Content Lab',
        description: 'AI-powered content creation and optimization tools.',
        icon: FileText,
        path: '/dashboard/content'
    },
    {
        id: 'competitors',
        title: 'Competitors',
        description: 'Analyze competitors and find opportunities to outrank them.',
        icon: Users,
        path: '/dashboard/competitors'
    }
];


const FeatureCard = ({ feature, index }: { feature: typeof features[0]; index: number }) => {
    const navigate = useNavigate();
    const Icon = feature.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => navigate(feature.path)}
            className="group relative bg-card border border-border/50 rounded-2xl p-6 cursor-pointer hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
        >
            {/* Elegant uniform overlay on hover */}
            <div className={`absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300`} />

            <div className="relative z-10">
                {/* Icon */}
                <div className={`inline-flex p-3 rounded-xl bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {feature.description}
                </p>



                {/* CTA */}
                <div className="flex items-center text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Explore</span>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </motion.div>
    );
};


export const DashboardHome = () => {
    return (
        <div className="space-y-12">
            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/20 p-8 md:p-12"
            >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10 max-w-3xl">
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center space-x-1">
                            <Sparkles className="w-3 h-3" />
                            <span>AI-Powered SEO Platform</span>
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                        Dashboard <span className="text-primary">Overview</span>
                    </h1>

                    <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                        The next-generation SEO intelligence platform that combines <strong>traditional SEO optimization</strong> with
                        <strong> AI Engine Optimization (AEO)</strong>. Track your visibility across search engines AND AI platforms
                        like ChatGPT, Claude, and Gemini.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { icon: Brain, label: 'AI-Powered', desc: 'GPT-4 Analysis' },
                            { icon: Zap, label: 'Real-time', desc: 'Live Monitoring' },
                            { icon: Target, label: 'Actionable', desc: 'Clear Insights' },
                            { icon: TrendingUp, label: 'Growth', desc: 'Track Progress' }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center space-x-3 p-3 rounded-xl bg-card/50 backdrop-blur border border-border/30">
                                <item.icon className="w-5 h-5 text-primary" />
                                <div>
                                    <div className="text-sm font-bold">{item.label}</div>
                                    <div className="text-xs text-muted-foreground">{item.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Features Section */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold">Platform Features</h2>
                        <p className="text-muted-foreground">Select a feature to get started</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <FeatureCard key={feature.id} feature={feature} index={index} />
                    ))}
                </div>
            </div>

            {/* Quick Stats Bar */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-card border border-border/50 rounded-2xl p-6"
            >
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm text-muted-foreground">All systems operational</span>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                        <div className="text-muted-foreground">
                            <span className="font-bold text-foreground">6</span> AI Agents Ready
                        </div>
                        <div className="text-muted-foreground">
                            <span className="font-bold text-foreground">GPT-4o</span> Powered
                        </div>
                        <div className="text-muted-foreground">
                            <span className="font-bold text-green-500">Active</span> Subscription
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
