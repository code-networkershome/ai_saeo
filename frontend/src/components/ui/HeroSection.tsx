import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Terminal, Bot, Zap, Shield, Cpu, Target, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const HeroSection = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleDeployClick = () => {
        if (user) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };
    return (
        <div className="relative pt-32 pb-20 lg:pt-56 lg:pb-32 overflow-hidden bg-background">
            {/* Background Architecture */}
            <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-primary/10 rounded-full blur-[140px] -z-10 opacity-30" />
            <div className="absolute bottom-[-50px] right-[-50px] w-96 h-96 bg-primary/5 rounded-full blur-[100px] -z-10" />

            {/* Neural Pattern Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none -z-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="inline-flex items-center space-x-3 px-4 py-1.5 rounded-full bg-secondary/30 border border-border/40 mb-10 backdrop-blur-md">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/80">SAEO Intelligent Node Active</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9] text-foreground">
                        ROBOTIC <br />
                        <span className="text-primary italic">SEO ENGINE</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-14 font-medium leading-relaxed tracking-tight">
                        Deconstruct search intent with <span className="text-foreground font-black">Autonomous Agents</span>.
                        Dominate AEO and SGE with <span className="text-foreground font-black">Recursive Content Engineering</span>.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <motion.button
                            onClick={handleDeployClick}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/30 flex items-center justify-center space-x-3 group"
                        >
                            <span>Initialize Agent Deck</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </motion.button>

                        <Link to="/login" className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-secondary/20 border border-border/50 hover:bg-secondary/40 transition-all font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-3 backdrop-blur-md">
                            <Terminal className="w-4 h-4 text-muted-foreground" />
                            <span>System Access</span>
                        </Link>
                    </div>
                </motion.div>

                {/* Robotic Workspace Mock */}
                <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="mt-24 relative mx-auto max-w-5xl group"
                >
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-[2.5rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
                    <div className="relative rounded-3xl border border-border/40 bg-background/40 backdrop-blur-2xl shadow-2xl overflow-hidden ring-1 ring-white/10">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-background/60">
                            <div className="flex space-x-2">
                                <div className="w-3 h-3 rounded-full bg-muted/30" />
                                <div className="w-3 h-3 rounded-full bg-muted/30" />
                                <div className="w-3 h-3 rounded-full bg-muted/30" />
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50 flex items-center gap-2">
                                <Shield className="w-3 h-3" />
                                core_intelligence_v2.0.4.sh — running
                            </div>
                        </div>
                        <div className="p-10 font-mono text-sm text-left space-y-4 h-[380px] overflow-hidden relative bg-black/5">
                            <div className="text-primary flex items-center gap-3 font-bold">
                                <span className="opacity-50">08:24:12</span>
                                <span className="text-white">{"[SYSTEM]"}</span>
                                <span>Injecting Semantic Schema to Cloudflare Edge...</span>
                            </div>
                            <div className="text-muted-foreground flex gap-3">
                                <span className="opacity-50">08:24:14</span>
                                <span>Scraping competitor [apple.com] content gaps...</span>
                            </div>
                            <div className="text-green-500 flex gap-3 font-bold">
                                <span className="opacity-50">08:24:18</span>
                                <span>[SUCCESS] Identity mapping complete. High-intent cluster identified.</span>
                            </div>
                            <div className="text-purple-400 flex gap-3">
                                <span className="opacity-50">08:24:22</span>
                                <span>[CRITIC] Content Draft #241 Rejected. Reason: Low Entity Density.</span>
                            </div>
                            <div className="text-primary flex gap-3 font-bold mt-4">
                                <span className="opacity-50">08:24:25</span>
                                <span className="text-white">{"[AGENT]"}</span>
                                <span>Recursive rewrite initiated. Targeting Entity: "Generative Search".</span>
                            </div>
                            <div className="text-green-400 flex gap-3">
                                <span className="opacity-50">08:24:30</span>
                                <span>[SUCCESS] New Content Asset Published (AEO Score: 98/100).</span>
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background/90 to-transparent backdrop-blur-[2px]" />
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
