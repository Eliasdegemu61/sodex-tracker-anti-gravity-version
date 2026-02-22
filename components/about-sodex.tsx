'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ArrowRight, Quote } from 'lucide-react';

export function AboutSodex() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const scrollToContent = () => {
        const content = document.getElementById('manifesto-content');
        if (content) {
            content.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-accent/30 selection:text-accent group/about">
            {/* Cinematic Hero Section */}
            <section className="relative h-[90vh] flex flex-col items-center justify-center overflow-hidden">
                {/* Premium Mesh Gradient Backdrop - Responsive */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-[#fdfdfd] dark:bg-[#0a0a0a] transition-colors duration-700" />
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/30 dark:bg-accent/20 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-500/20 dark:bg-orange-600/10 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
                    <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-orange-400/20 dark:bg-orange-400/10 rounded-full blur-[100px] animate-pulse [animation-delay:4s]" />

                    {/* Swirling dots/grain effect */}
                    <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.03] pointer-events-none"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                    />
                </div>

                {/* Hero Content */}
                <div className={`relative z-10 container mx-auto px-6 text-center transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                    <div className="relative w-20 md:w-24 mx-auto mb-8">
                        <img
                            src="https://sodex.com/_next/image?url=%2Flogo%2Flogo.webp&w=256&q=75"
                            alt="SoDEX Logo"
                            className="w-full drop-shadow-[0_0_15px_rgba(255,165,0,0.3)] dark:inline hidden"
                        />
                        <img
                            src="https://testnet.sodex.com/assets/SoDEX-Dh5Mk-Pl.svg"
                            alt="SoDEX Logo"
                            className="w-full drop-shadow-[0_0_5px_rgba(0,0,0,0.1)] dark:hidden inline"
                        />
                    </div>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-b from-black to-black/60 dark:from-white dark:to-white/60 bg-clip-text text-transparent max-w-4xl mx-auto leading-tight transition-colors">
                        Enable crypto investment for the global masses
                    </h1>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button
                            size="lg"
                            onClick={scrollToContent}
                            className="px-8 h-12 bg-black dark:bg-white hover:bg-black/90 dark:hover:bg-white/90 text-white dark:text-black font-semibold rounded-full group shadow-[0_0_20px_rgba(255,165,0,0.15)]"
                        >
                            Start Exploring
                            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-30 dark:opacity-50">
                    <ChevronDown className="w-6 h-6 text-black dark:text-white" />
                </div>
            </section>

            {/* What is Sodex Content */}
            <section id="manifesto-content" className="py-24 md:py-32 container mx-auto px-6 max-w-5xl">
                <div className="space-y-16">
                    <div className="prose prose-invert prose-lg max-w-none space-y-8 text-muted-foreground leading-relaxed">
                        <p className="text-xl text-foreground font-medium">
                            <span className="text-accent font-bold">SoDEX</span> on ValueChain, aiming to create the ultimate form of decentralized trading. SoDEX is a high-performance order book decentralized exchange (DEX). It seeks to combine the millisecond-level trading experience and deep liquidity of centralized order books (CLOB) with the non-custodial, transparent, and censorship-resistant attributes of decentralized systems - providing active traders with a frictionless trading environment.
                        </p>

                        <div className="space-y-6 pt-12 border-t border-border">
                            <h2 className="text-2xl font-bold text-foreground tracking-tight mb-8">Comprehensive Response to Industry Pain Points</h2>

                            <div className="w-full overflow-x-auto rounded-xl border border-border bg-card">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-border bg-card/50">
                                            <th className="p-4 text-accent font-semibold w-1/4">Feature</th>
                                            <th className="p-4 text-foreground font-semibold w-1/4">Core Value</th>
                                            <th className="p-4 text-accent font-semibold w-1/2">Implementation</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border text-sm md:text-base">
                                        <tr className="hover:bg-secondary/20 transition-colors">
                                            <td className="p-4 text-foreground font-medium align-top">Seamless User Experience</td>
                                            <td className="p-4 text-foreground align-top">The smoothness of CeFi</td>
                                            <td className="p-4 text-muted-foreground leading-relaxed">
                                                Resolves DeFi's high-threshold issues by abstracting gas fees and simplifying wallet interactions, enabling users to enjoy a trading experience as smooth and intuitive as a centralized exchange.
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-secondary/20 transition-colors">
                                            <td className="p-4 text-foreground font-medium align-top">Order book based</td>
                                            <td className="p-4 text-foreground align-top">Professional-grade precision execution</td>
                                            <td className="p-4 text-muted-foreground leading-relaxed">
                                                Adopts a trader-preferred order book model, supporting limit and stop orders at multiple levels. Ensures precise execution at specified prices, eliminating slippage common in AMM models, and providing a solid foundation for quantitative and high-frequency strategies.
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-secondary/20 transition-colors">
                                            <td className="p-4 text-foreground font-medium align-top">Secure</td>
                                            <td className="p-4 text-foreground align-top">Institutional-grade asset protection</td>
                                            <td className="p-4 text-muted-foreground leading-relaxed">
                                                Assets are held in non-custodial wallets, enhanced by institutional custody solutions to further strengthen security. Meanwhile, integrated on-chain KYT (Know-Your-Transaction) tools monitor and identify risk addresses in real time - safeguarding the spirit of decentralization while meeting compliance requirements.
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-secondary/20 transition-colors">
                                            <td className="p-4 text-foreground font-medium align-top">On-Chain Transparency</td>
                                            <td className="p-4 text-foreground align-top">Verifiable trust</td>
                                            <td className="p-4 text-muted-foreground leading-relaxed">
                                                All trades, order matching, and settlement logic are executed on-chain by smart contracts. Every operation is public, traceable, and verifiable, eliminating opaque manipulation and hidden risks present in centralized platforms.
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Footer CTA */}
                    <div className="pt-16 text-center border-t border-border">
                        <div className="relative w-32 mx-auto mb-8 opacity-60">
                            <img
                                src="https://sodex.com/_next/image?url=%2Flogo%2Flogo.webp&w=256&q=75"
                                alt="SoDEX Logo"
                                className="w-full dark:inline hidden"
                            />
                            <img
                                src="https://testnet.sodex.com/assets/SoDEX-Dh5Mk-Pl.svg"
                                alt="SoDEX Logo"
                                className="w-full dark:hidden inline"
                            />
                        </div>
                        <p className="text-muted-foreground mb-8 text-sm">Welcome aboard. May we journey forward together.</p>
                        <a href="https://sodex.com/join/TRADING" target="_blank" rel="noopener noreferrer">
                            <Button size="lg" className="rounded-full px-12 bg-black dark:bg-white hover:bg-black/90 dark:hover:bg-white/90 text-white dark:text-black font-bold shadow-[0_0_15px_rgba(255,165,0,0.3)]">
                                Join the Expedition
                            </Button>
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}
