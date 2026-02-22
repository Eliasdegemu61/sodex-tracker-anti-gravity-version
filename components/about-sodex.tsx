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
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 dark:bg-accent/20 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-500/10 dark:bg-orange-600/10 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
                    <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-orange-300/10 dark:bg-orange-400/10 rounded-full blur-[100px] animate-pulse [animation-delay:4s]" />

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
                        From Casino to the New Ark
                    </h1>

                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
                        To Those Who Still Survive in Crypto, with the Launch of SoDEX.
                        A shared journey to rediscover what this industry was meant to be.
                    </p>

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

            {/* Manifesto Content */}
            <section id="manifesto-content" className="py-24 md:py-32 container mx-auto px-6 max-w-4xl">
                <div className="space-y-16">
                    {/* Quote Section */}
                    <div className="text-center space-y-4">
                        <Quote className="w-10 h-10 text-accent mx-auto opacity-30" />
                        <p className="text-2xl md:text-3xl font-medium italic text-foreground tracking-tight">
                            "Love One Another Inclusively, Benefit One Another Mutually."
                        </p>
                        <p className="text-muted-foreground font-semibold">— Mozi</p>
                    </div>

                    <div className="prose prose-invert prose-lg max-w-none space-y-8 text-muted-foreground leading-relaxed">
                        <p className="text-xl text-foreground font-medium first-letter:text-5xl first-letter:font-bold first-letter:mr-3 first-letter:float-left first-letter:text-accent">
                            Welcome aboard. May we journey forward together, using technology to strengthen consensus, ease division, and foster peace.
                            <a href="https://sodex.com" className="text-accent hover:underline ml-2">sodex.com</a>
                        </p>

                        <p>
                            To the Fellow SoSoValue Ecosystem Voyagers,
                            Thank you for being here at this moment. What you hold is a boarding pass for our earliest companions. This is not simply a product launch. It is an invitation to those who choose to come aboard, as we begin a shared journey to rediscover what this industry was meant to be.
                        </p>

                        <div className="space-y-6 pt-8 border-t border-border">
                            <h2 className="text-3xl font-bold text-foreground tracking-tight">The Ark and the Long Drift</h2>
                            <p>
                                Crypto's story begins in 2008, amid the global financial crisis, when trust in the traditional financial system collapsed almost overnight. In that moment, Satoshi Nakamoto released the Bitcoin whitepaper — and built an ark for the world.
                            </p>
                            <p>
                                Its design was simple but radical: no trusted intermediaries, self-custodied private keys, true ownership of assets, and a new way to reconstruct trust through blockchain technology. From the very beginning, this technology was meant as a gift to ordinary people — not a tool for Wall Street.
                            </p>
                            <p>
                                To those who believe in technology’s development to reshape the world, AI and blockchain represent two foundational forces: one redefining productivity, the other reshaping the very structure of economic relationships — together forming the bedrock of the next twenty years.
                            </p>
                            <p>
                                Seventeen years later, this ark called Crypto began to drift off course, lost in fog and noise. Bitcoin had grown into a giant, yet the industry’s center of gravity quietly shifted.
                            </p>
                            <p>
                                While AI was reshaping productivity at an exponential pace and opening new frontiers of real value, crypto narrowed itself into an increasingly explicit game of liquidity speculation. As meaningful innovation stalled, doubts grew about whether blockchain still held relevance beyond its own ecosystem.
                            </p>

                            <div className="bg-secondary/20 p-8 rounded-2xl border border-border italic">
                                Inside the industry, the shift was even more stark. Exchanges systematically promoted products with extreme leverage. The implicit goal was no longer to improve trading efficiency, but to increase the likelihood of liquidation. Gradually, the nature of gambling overtook that of a trading platform.
                            </div>

                            <p>
                                At the same time, project teams turned away from users. Their primary audience became exchanges, market makers, and venture capital firms. User value nearly vanished from the equation. Token issuance ceased to be an act of asset listing and became the opening of yet another betting table. Asset quality lost relevance. The only remaining question was whether more participants could be drawn in to place their trades.
                            </p>
                        </div>

                        <div className="space-y-6 pt-12 border-t border-border">
                            <h2 className="text-3xl font-bold text-foreground tracking-tight">Can Blockchain Still Shape the World?</h2>
                            <p>
                                When building became an object of ridicule and speculation rose to dominance, what unfolded was not value creation through technology, but the acceleration of entropy in its name. The drift reached its peak inside a mirage of false prosperity.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-12 items-center">
                                <Card className="overflow-hidden bg-card border-border flex flex-col items-center justify-center h-full min-h-[200px] group shadow-xl transition-all border-none">
                                    <img
                                        src="https://pbs.twimg.com/media/HANAxEybMAAw-Da?format=jpg&name=large"
                                        alt="The Decoupling Chart"
                                        className="w-full h-auto object-cover"
                                    />
                                </Card>
                                <div className="space-y-4">
                                    <p className="font-semibold text-foreground italic">
                                        Figure 1: Bitcoin underperforming traditional assets and decoupling from Gold since October 2025. Data Source: SoSoValue
                                    </p>
                                    <p className="text-sm">
                                        As the mirage evaporated, it left behind more than disillusionment. Hard realities surfaced. But vast amounts of noise disappeared with it.
                                    </p>
                                </div>
                            </div>

                            <p>
                                We believe that blockchain will truly change how humanity establishes trust, and its first destination must be the finance industry. By rebuilding the financial system, we can offer more people around the world, and all forms of participants, even including AI agents, an equal entry point into financial life.
                            </p>
                        </div>

                        <div className="space-y-6 pt-12 border-t border-border">
                            <h2 className="text-3xl font-bold text-foreground tracking-tight">SoSoValue’s Origins and Mission</h2>
                            <p>
                                SoSoValue did not begin as a consumer product. It began as an internal research tool. The motivation was simple and uncompromising. We were a team focused on investing in technology.
                            </p>
                            <p>
                                In early 2024, a mainstream opportunity found us for the first time. We launched the world’s first Bitcoin spot ETF dashboard. We also became the first platform to systematically define and track net inflows and net outflows as a core metric. By helping users truly see where capital was moving, we earned our first million high-quality, real users.
                            </p>
                            <p>
                                From there, our vision and mission became clear: <span className="text-foreground font-bold">Enable crypto investment for the global masses.</span> Put investors at the center. Use AI and blockchain to build a platform that reduces noise, increases efficiency, and makes investing more accessible, with investor interest as the first principle.
                            </p>
                        </div>

                        <div className="space-y-6 pt-12 border-t border-border">
                            <h2 className="text-3xl font-bold text-foreground tracking-tight">Why Building SoDEX?</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-10">
                                <div className="p-6 bg-secondary/30 rounded-xl border border-border hover:bg-secondary/50 transition-colors">
                                    <div className="text-accent font-bold text-xl mb-2">I. Information</div>
                                    <p className="text-xs">Reducing asymmetry and filtering noise through professional terminals.</p>
                                </div>
                                <div className="p-6 bg-secondary/30 rounded-xl border border-border hover:bg-secondary/50 transition-colors">
                                    <div className="text-accent font-bold text-xl mb-2">II. Allocation</div>
                                    <p className="text-xs">SSI Index Protocol enabling sustainable long-term returns through beta exposure.</p>
                                </div>
                                <div className="p-6 bg-secondary/30 rounded-xl border border-border hover:bg-secondary/50 transition-colors">
                                    <div className="text-accent font-bold text-xl mb-2">III. Scale</div>
                                    <p className="text-xs">High-performance Layer 1 infrastructure for borderless asset exchange.</p>
                                </div>
                            </div>

                            <p>
                                We needed a high-performance onchain platform built around an order book. We had no intent to reinvent the wheel. Yet after extensive research, we found that no existing chain could achieve all three requirements at once. The conclusion became evident: to continue sailing in the direction of our original mission, we had to build our own Layer 1 Chain.
                            </p>
                        </div>

                        <div className="space-y-6 pt-12 border-t border-border">
                            <h2 className="text-3xl font-bold text-foreground tracking-tight">SoDEX, Making the Ark Seaworthy Again</h2>
                            <p>
                                Satoshi built the first ark so ordinary people hold assets that could not be diluted. We want to follow that original intent and build an onchain financial ark. One that allows everyday participants to invest and trade assets safely and efficiently.
                            </p>

                            <p className="text-foreground font-semibold">SoDEX is built on two non-negotiable principles: Transparency and Security.</p>

                            <ul className="list-disc pl-6 space-y-4">
                                <li><span className="text-foreground font-medium">Composite Architecture</span>: Connecting spot and perpetual markets seamlessly.</li>
                                <li><span className="text-foreground font-medium">Integrated RWA</span>: Trade crypto-native assets alongside equities, indices, and commodities.</li>
                                <li><span className="text-foreground font-medium">Relentless UX</span>: Making institutional-grade performance a basic right for everyone.</li>
                            </ul>
                        </div>

                        <div className="space-y-6 pt-12 border-t border-border">
                            <h2 className="text-3xl font-bold text-foreground tracking-tight">A New "Renaissance" Moment</h2>
                            <p>
                                Today, we stand at a similar crossroads. AI is the printing press of our time. It makes intelligence and productivity abundant. Crypto is the double-entry system of our time. It upgrades trust based on people to verification based on code.
                            </p>
                            <p className="italic bg-accent/10 border-l-4 border-accent p-6 rounded-r-xl">
                                "Stop Gambling. Start Compounding."
                            </p>
                            <p>
                                This is your boarding pass. Boarding pass privileges will be distributed to eligible early users, according to official announcements.
                            </p>
                            <div className="pt-8 text-right space-y-1">
                                <p className="text-foreground font-bold">SoSoValue & SoDEX Founding Team</p>
                                <p className="text-muted-foreground text-sm">February 2, 2026</p>
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
