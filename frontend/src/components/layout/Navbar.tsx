import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Cpu } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useAuth } from '../../contexts/AuthContext';

export const Navbar = () => {
    const { user, signOut } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSignOut = async () => {
        await signOut();
    };

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent ${scrolled ? "bg-background/80 backdrop-blur-md border-border/40" : "bg-transparent"
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link to="/" className="flex items-center space-x-2 group">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:border-primary/50 transition-colors">
                            <Cpu className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-mono font-bold text-lg tracking-tight">
                            SAEO<span className="text-primary">.ai</span>
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center space-x-8">
                        <Link to="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</Link>
                        <Link to="#agents" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Agents</Link>
                        <Link to="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
                    </div>

                    <div className="hidden md:flex items-center space-x-4">
                        <ThemeToggle />
                        {user ? (
                            <>
                                <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">Dashboard</Link>
                                <button
                                    onClick={handleSignOut}
                                    className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">Sign In</Link>
                                <Link to="/signup" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="md:hidden flex items-center space-x-4">
                        <ThemeToggle />
                        <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-muted-foreground hover:text-foreground">
                            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* AnimatePresence Removed */}
            {isOpen && (
                <div
                    className="md:hidden bg-background border-b border-border"
                >
                    <div className="px-4 pt-2 pb-6 space-y-4">
                        <Link to="#features" className="block text-base font-medium text-muted-foreground hover:text-foreground">Features</Link>
                        <Link to="#agents" className="block text-base font-medium text-muted-foreground hover:text-foreground">Agents</Link>
                        {user ? (
                            <button
                                onClick={handleSignOut}
                                className="block w-full text-left text-base font-medium text-red-500"
                            >
                                Sign Out
                            </button>
                        ) : (
                            <Link to="/login" className="block text-base font-medium text-primary">Login</Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};
