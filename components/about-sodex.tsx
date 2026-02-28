'use client';

import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export function AboutSodex() {
    return (
        <div className="min-h-[calc(100vh-80px)] w-full flex items-center justify-center p-4 md:p-8">
            {/* Outer Container mimicking the white border/padding */}
            <div className="w-full max-w-[1200px] bg-white p-2.5 md:p-3 rounded-[2.5rem] shadow-2xl mx-auto">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-3">

                    {/* Left Column (Light Theme) */}
                    <div className="bg-[#f2f2f2] rounded-[2rem] p-8 md:p-14 flex flex-col justify-between min-h-[500px]">
                        <div>
                            <h2 className="text-3xl md:text-[2.75rem] font-light text-[#888888] leading-[1.1] mb-6 tracking-tight">
                                How SoDEX <br />
                                <span className="font-medium text-[#111111]">is reshaping<br className="hidden md:block" /> decentralized trading</span>
                            </h2>
                            <p className="text-[#666666] text-[15px] leading-relaxed max-w-sm mb-12">
                                From advanced order books to cutting-edge custody solutions, SoDEX is driving a new era of efficiency, reliability, and scalability.
                            </p>

                            <div className="flex flex-col gap-4 max-w-md">
                                {[
                                    { title: 'Performance', desc: 'Institutional-grade execution with sub-second latency for seamless trading.' },
                                    { title: 'Zero Gas', desc: 'Gasless transactions mean you only pay when you trade, maximizing your returns.' },
                                    { title: 'Order Book', desc: 'True central limit order book (CLOB) offering deep liquidity and precise execution.' },
                                    { title: 'Self-Custody', desc: 'Maintain complete control of your assets with non-custodial smart contracts.' },
                                    { title: 'High Speed', desc: 'Built on high-throughput infrastructure to ensure trades settle instantly.' }
                                ].map(feature => (
                                    <div key={feature.title} className="flex gap-3">
                                        <div className="mt-1 flex-shrink-0">
                                            <div className="w-2 h-2 rounded-full bg-[#f97316]"></div>
                                        </div>
                                        <div>
                                            <h4 className="text-[14px] font-semibold text-[#111111] mb-0.5">{feature.title}</h4>
                                            <p className="text-[#666666] text-[13px] leading-snug">{feature.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-12 md:mt-16">
                            {/* Removed Start Trading button per user request */}
                        </div>
                    </div>

                    {/* Right Column (Dark Theme) */}
                    <div className="bg-[#151515] rounded-[2rem] p-8 md:p-14 flex flex-col justify-between min-h-[500px] relative overflow-hidden">

                        {/* Top Content */}
                        <div className="relative z-10">
                            <h3 className="text-2xl md:text-[1.75rem] font-medium text-white mb-4 tracking-tight">
                                The Future Forged in Decentralization.
                            </h3>
                            <p className="text-[#888888] text-[15px] leading-relaxed max-w-md">
                                By merging CeFi performance with DeFi innovation, we are unlocking smarter trading solutions that reduce costs, enhance execution, and shape the future of Web3.
                            </p>
                        </div>

                        {/* Center Graphic */}
                        <div className="relative h-48 md:h-56 w-full border border-white/[0.04] rounded-2xl mt-12 mb-12 flex items-center justify-center overflow-hidden">
                            {/* Subtle Grid Background */}
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px]" />

                            {/* Horizontal Line */}
                            <div className="absolute top-1/2 left-0 w-full h-px bg-white/[0.04] -translate-y-1/2" />

                            {/* Overlapping Circles Series */}
                            <div className="relative flex items-center justify-center w-[120%] h-full max-w-[600px] mx-auto scale-75 md:scale-100">
                                {/* Circle 1 (Orange Dashed) */}
                                <div className="absolute z-10 w-[140px] h-[140px] rounded-full border border-[#f97316]/60 flex items-center justify-center bg-[#151515] shadow-[0_0_40px_rgba(249,115,22,0.05)] -translate-x-[110px]" style={{ borderStyle: 'dashed', borderWidth: '1.5px' }}>
                                    <span className="text-[#f97316] text-[11px] font-medium tracking-wide">Speed</span>
                                </div>
                                {/* Circle 2 */}
                                <div className="absolute w-[140px] h-[140px] rounded-full border border-white/[0.08] flex items-center justify-center -translate-x-[35px]">
                                    <span className="text-white/40 text-[11px] tracking-wide">Security</span>
                                </div>
                                {/* Circle 3 */}
                                <div className="absolute w-[140px] h-[140px] rounded-full border border-white/[0.08] flex items-center justify-center translate-x-[40px]">
                                    <span className="text-white/40 text-[11px] tracking-wide">Liquidity</span>
                                </div>
                                {/* Circle 4 */}
                                <div className="absolute w-[140px] h-[140px] rounded-full border border-white/[0.08] flex items-center justify-center translate-x-[115px]">
                                    <span className="text-white/40 text-[11px] tracking-wide">Innovation</span>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Footer Elements */}
                        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-4">

                            {/* Start Trading Badge/Button */}
                            <a href="https://sodex.com/join/TRADING" target="_blank" rel="noopener noreferrer">
                                <div className="flex items-center gap-3 bg-[#111111] hover:bg-black transition-colors px-5 py-2.5 rounded-full border border-[#1a1a1a] cursor-pointer shadow-md">
                                    <div className="flex items-center justify-center w-4 h-4 rounded-full border-[1.5px] border-[#f97316]/50 overflow-hidden">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.4)_0%,transparent_100%)] shadow-[0_0_8px_rgba(249,115,22,0.5)]"></div>
                                    </div>
                                    <span className="text-white text-[14px] font-medium tracking-wide">Start Trading</span>
                                </div>
                            </a>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
