'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

/* ─── Design tokens ─── */
const ORB_STYLES = {
    hero: {
        top: '-15%',
        right: '-10%',
        width: '65%',
        paddingBottom: '65%',
        background:
            'radial-gradient(circle, rgba(255,110,30,0.55) 0%, rgba(220,70,10,0.30) 35%, transparent 70%)',
        filter: 'blur(60px)',
    },
    mid: {
        bottom: '5%',
        left: '-20%',
        width: '60%',
        paddingBottom: '60%',
        background:
            'radial-gradient(circle, rgba(255,90,20,0.40) 0%, rgba(180,50,5,0.20) 40%, transparent 70%)',
        filter: 'blur(80px)',
    },
    feature2: {
        top: '50%',
        right: '-15%',
        width: '45%',
        paddingBottom: '45%',
        background:
            'radial-gradient(circle, rgba(255,100,20,0.35) 0%, transparent 65%)',
        filter: 'blur(70px)',
    },
} as const;

const FEATURES = [
    {
        index: '01',
        name: 'Seamless\nUser Experience',
        value: 'The smoothness of CeFi',
        detail:
            "Resolves DeFi's high-threshold issues by abstracting gas fees and simplifying wallet interactions, enabling users to enjoy a trading experience as smooth and intuitive as a centralized exchange.",
    },
    {
        index: '02',
        name: 'Order Book\nBased',
        value: 'Professional-grade precision execution',
        detail:
            'Adopts a trader-preferred order book model, supporting limit and stop orders at multiple levels. Ensures precise execution at specified prices, eliminating slippage common in AMM models.',
    },
    {
        index: '03',
        name: 'Secure',
        value: 'Institutional-grade asset protection',
        detail:
            'Assets are held in non-custodial wallets, enhanced by institutional custody solutions. Integrated on-chain KYT tools monitor risk addresses in real time — safeguarding decentralization while meeting compliance.',
    },
    {
        index: '04',
        name: 'On-Chain\nTransparency',
        value: 'Verifiable trust',
        detail:
            'All trades, order matching, and settlement logic are executed on-chain by smart contracts. Every operation is public, traceable, and verifiable — eliminating opaque manipulation on centralized platforms.',
    },
];

/* ─── Animated counter for mounted state ─── */
function useReveal() {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
            { threshold: 0.15 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return { ref, visible };
}

/* ─── Single feature row ─── */
function FeatureRow({ f, i }: { f: typeof FEATURES[0]; i: number }) {
    const [open, setOpen] = useState(false);
    const { ref, visible } = useReveal();

    return (
        <div
            ref={ref}
            className="group border-t border-white/10 cursor-pointer"
            style={{
                transition: 'opacity 0.7s ease, transform 0.7s ease',
                transitionDelay: `${i * 120}ms`,
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(28px)',
            }}
            onClick={() => setOpen(o => !o)}
        >
            {/* Row header */}
            <div className="flex items-end justify-between gap-6 py-8 md:py-10">
                {/* Index */}
                <span
                    className="text-xs tracking-[0.2em] font-mono self-start pt-2 shrink-0"
                    style={{ color: 'rgba(255,255,255,0.25)' }}
                >
                    {f.index}
                </span>

                {/* Feature name — large serif */}
                <div className="flex-1">
                    <h3
                        className="text-3xl sm:text-4xl md:text-5xl leading-tight text-white group-hover:text-orange-300 transition-colors duration-300 whitespace-pre-line"
                        style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontWeight: 400 }}
                    >
                        {f.name}
                    </h3>
                </div>

                {/* Core value + arrow */}
                <div className="hidden md:flex flex-col items-end gap-2 shrink-0 max-w-[220px] text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/40">{f.value}</p>
                    <ArrowUpRight
                        className="w-5 h-5 text-white/30 group-hover:text-orange-400 transition-all duration-300"
                        style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.4s ease, color 0.3s ease' }}
                    />
                </div>
            </div>

            {/* Expandable detail */}
            <div
                style={{
                    maxHeight: open ? '200px' : '0px',
                    overflow: 'hidden',
                    transition: 'max-height 0.5s cubic-bezier(0.4,0,0.2,1)',
                }}
            >
                <div className="pb-8 md:pb-10 pl-8 md:pl-0 md:ml-[4.5rem]">
                    <p className="text-white/50 text-sm md:text-base leading-relaxed max-w-2xl">
                        {f.detail}
                    </p>
                </div>
            </div>
        </div>
    );
}

/* ─── Main component ─── */
export function AboutSodex() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    return (
        /* Force dark — match the cinematic reference aesthetic */
        <div className="bg-[#0c0c0c] font-sans" style={{ color: '#fff' }}>

            {/* ── HERO ── */}
            <section className="relative min-h-screen flex flex-col justify-end overflow-hidden px-6 md:px-16 pb-20 md:pb-28">
                {/* Orb — hero */}
                <div className="absolute pointer-events-none" style={{ ...ORB_STYLES.hero, position: 'absolute' }}>
                    <div style={{ position: 'absolute', inset: 0, background: ORB_STYLES.hero.background, filter: ORB_STYLES.hero.filter, borderRadius: '50%' }} />
                </div>

                {/* Orb — mid-left */}
                <div className="absolute pointer-events-none" style={{ ...ORB_STYLES.mid, position: 'absolute' }}>
                    <div style={{ position: 'absolute', inset: 0, background: ORB_STYLES.mid.background, filter: ORB_STYLES.mid.filter, borderRadius: '50%' }} />
                </div>

                {/* Noise grain */}
                <div
                    className="absolute inset-0 opacity-[0.04] pointer-events-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }}
                />

                {/* Hero content */}
                <div
                    className="relative z-10 max-w-6xl w-full"
                    style={{
                        transition: 'opacity 1.2s ease, transform 1.2s ease',
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? 'translateY(0)' : 'translateY(40px)',
                    }}
                >
                    {/* Logo */}
                    <div className="mb-12 w-14">
                        <img
                            src="https://sodex.com/_next/image?url=%2Flogo%2Flogo.webp&w=256&q=75"
                            alt="SoDEX"
                            className="w-full drop-shadow-[0_0_20px_rgba(255,120,30,0.5)]"
                        />
                    </div>

                    {/* Giant display heading */}
                    <h1
                        className="text-[clamp(3.5rem,12vw,10rem)] leading-[0.9] tracking-tight text-white mb-10"
                        style={{ fontFamily: "'Georgia','Times New Roman',serif", fontWeight: 400 }}
                    >
                        SoDEX
                    </h1>

                    {/* Intro block — right-aligned editorial */}
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
                        <p className="text-white/40 text-sm uppercase tracking-[0.2em]">
                            Decentralised Exchange · ValueChain
                        </p>
                        <p className="md:max-w-sm text-white/60 text-sm md:text-base leading-relaxed text-right">
                            A high-performance order book DEX — combining the millisecond execution of centralised order books with the transparency and non-custody of decentralised systems.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section id="manifesto-content" className="relative px-6 md:px-16 py-20 md:py-32 max-w-6xl mx-auto overflow-hidden">

                {/* Orb behind features */}
                <div className="absolute pointer-events-none" style={{ ...ORB_STYLES.feature2, position: 'absolute' }}>
                    <div style={{ position: 'absolute', inset: 0, background: ORB_STYLES.feature2.background, filter: ORB_STYLES.feature2.filter, borderRadius: '50%' }} />
                </div>

                {/* Section label */}
                <p className="text-xs uppercase tracking-[0.3em] text-white/30 mb-16 md:mb-20">
                    Core Pillars
                </p>

                {/* Feature rows */}
                <div>
                    {FEATURES.map((f, i) => (
                        <FeatureRow key={f.index} f={f} i={i} />
                    ))}
                    {/* closing rule */}
                    <div className="border-t border-white/10" />
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="relative px-6 md:px-16 py-24 md:py-36 overflow-hidden">
                {/* Orb CTA */}
                <div
                    className="absolute pointer-events-none"
                    style={{
                        bottom: '-20%', right: '5%',
                        width: '50%', paddingBottom: '50%',
                        position: 'absolute',
                    }}
                >
                    <div style={{
                        position: 'absolute', inset: 0, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(255,100,20,0.45) 0%, rgba(200,60,5,0.20) 45%, transparent 70%)',
                        filter: 'blur(80px)',
                    }} />
                </div>

                <div className="relative z-10 max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-end justify-between gap-12">
                    <h2
                        className="text-[clamp(2.2rem,6vw,5rem)] leading-tight text-white max-w-2xl"
                        style={{ fontFamily: "'Georgia','Times New Roman',serif", fontWeight: 400 }}
                    >
                        Let's journey into the future of decentralised trading.
                    </h2>

                    <div className="shrink-0">
                        <a href="https://sodex.com/join/TRADING" target="_blank" rel="noopener noreferrer">
                            {/* Circle CTA — matches inspo */}
                            <div
                                className="group relative w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-500 hover:scale-105"
                                style={{
                                    background: 'radial-gradient(circle at 40% 40%, rgba(255,120,40,0.9), rgba(180,50,10,0.95))',
                                    boxShadow: '0 0 60px rgba(255,100,20,0.45)',
                                }}
                            >
                                <span className="text-xs text-white/90 text-center font-medium tracking-wide leading-snug px-4">
                                    Join the<br />Expedition
                                </span>
                                <ArrowRight className="absolute bottom-7 right-7 w-4 h-4 text-white/70 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                            </div>
                        </a>
                    </div>
                </div>

                {/* Bottom wordmark */}
                <div className="relative z-10 max-w-6xl mx-auto mt-24 pt-8 border-t border-white/10 flex items-center justify-between">
                    <p className="text-white/20 text-xs tracking-[0.2em] uppercase">Built on ValueChain</p>
                </div>
            </section>
        </div>
    );
}
