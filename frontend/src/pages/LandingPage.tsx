import { Navbar } from '../components/layout/Navbar';
import { HeroSection } from '../components/ui/HeroSection';
import { Bot, Zap, Shield, Target, Globe, Activity, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const FeatureCard = ({ icon: Icon, title, description, badge }: { icon: any, title: string, description: string, badge?: string }) => (
    <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        className="p-10 rounded-[2.5rem] bg-card/40 border border-border/40 hover:border-primary/50 transition-all group backdrop-blur-xl relative overflow-hidden"
    >
        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Icon className="w-24 h-24" />
        </div>

        <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-8 border border-border/50 group-hover:bg-primary/10 transition-colors">
            <Icon className="w-8 h-8 text-primary" />
        </div>

        {badge && (
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-black uppercase tracking-widest text-primary mb-4">
                {badge}
            </span>
        )}

        <h3 className="text-2xl font-black mb-4 tracking-tight group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-muted-foreground leading-loose text-sm font-medium tracking-tight">{description}</p>

        <div className="mt-8 pt-8 border-t border-border/10">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 group-hover:text-primary transition-colors">
                <span>View Documentation</span>
                <ArrowRight className="w-3 h-3" />
            </div>
        </div>
    </motion.div>
);

export const LandingPage = () => {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
            <Navbar />

            <main>
                <HeroSection />

                {/* Features Architecture */}
                <section id="features" className="py-32 relative">
                    <div className="absolute inset-0 bg-secondary/5 -z-10" />

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row items-end justify-between mb-24 gap-8">
                            <div className="max-w-2xl">
                                <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-4 block">Autonomous Intelligence</span>
                                <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9]">AGENTIC SEO <br />AT SCALE</h2>
                            </div>
                            <p className="text-lg text-muted-foreground max-w-sm font-medium leading-relaxed italic border-l-2 border-primary/20 pl-6">
                                "The era of manual optimization is over. Our autonomous agents adapt faster than Google's own core updates."
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                            <FeatureCard
                                icon={Bot}
                                title="AEO Intelligence"
                                badge="Core Engine"
                                description="Deep entity mapping to ensure your brand is the primary citation for ChatGPT, Claude, Gemini, and SGE."
                            />
                            <FeatureCard
                                icon={Shield}
                                title="Technical Audit"
                                badge="Infrastructure"
                                description="Multi-agent verification for HSTS, CSP, and security headers. Clean technical signals for maximum trust."
                            />
                            <FeatureCard
                                icon={Zap}
                                title="Performance Edge"
                                badge="Optimization"
                                description="Real-time Core Web Vitals monitoring with automated fix roadmaps for LCP, CLS, and FCP."
                            />
                            <FeatureCard
                                icon={Target}
                                title="Keyword Discovery"
                                badge="Research"
                                description="Axiomatic keyword cluster mapping. Identify high-value intent before your competitors do."
                            />
                            <FeatureCard
                                icon={Globe}
                                title="Market Competitors"
                                badge="Intelligence"
                                description="Recursive deconstruction of competitor positioning and traffic strategies using live scraping agents."
                            />
                            <FeatureCard
                                icon={Activity}
                                title="Web Analytics"
                                badge="Conversion"
                                description="Self-healing SEO architecture. Connect GSC and Analytics for a unified view of your search ecosystem."
                            />
                        </div>
                    </div>
                </section>


            </main>

            <footer className="py-20 border-t border-border/40 bg-secondary/5">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-8 select-none">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-black tracking-tighter">SAEO<span className="text-primary italic">.</span></span>
                    </div>
                    <div className="flex justify-center gap-12 mb-12">
                        {['Docs', 'Status', 'Twitter', 'GitHub'].map(link => (
                            <a key={link} href="#" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 hover:text-primary transition-colors">{link}</a>
                        ))}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40">© 2026 Recursive SEO Intelligence. All systems nominal.</p>
                </div>
            </footer>
        </div>
    );
};
