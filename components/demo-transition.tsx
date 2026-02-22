'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface DemoTransitionProps {
    onComplete: () => void;
}

const steps = [
    "Establishing Secure Connection...",
    "Bypassing Vault Firewalls...",
    "Retrieving Snapshot Data...",
    "Decrypting Portfolio Metrics...",
    "Finalizing Sandbox Access..."
];

export function DemoTransition({ onComplete }: DemoTransitionProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const stepInterval = setInterval(() => {
            setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
        }, 400);

        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                const next = prev + 1;
                if (next >= 100) {
                    clearInterval(progressInterval);
                    clearInterval(stepInterval);
                    setTimeout(onComplete, 300);
                    return 100;
                }
                return next;
            });
        }, 20);

        return () => {
            clearInterval(stepInterval);
            clearInterval(progressInterval);
        };
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden">
            {/* Background with animated gradients */}
            <div className="absolute inset-0 bg-[#0f0f0d]">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full px-6">
                {/* Large Spinner/Orbit */}
                <div className="relative mb-12">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 animate-pulse" />
                    <div className="w-24 h-24 border-t-2 border-r-2 border-primary rounded-full animate-spin shadow-[0_0_20px_rgba(255,165,0,0.5)]" />
                    <div className="absolute inset-2 border-b-2 border-l-2 border-orange-400/50 rounded-full animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
                    <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary animate-pulse" />
                </div>

                {/* Animated Text Steps */}
                <div className="space-y-4 mb-8 h-20 flex flex-col justify-center">
                    <h2 className="text-xl md:text-2xl font-bold text-white tracking-widest uppercase">
                        {steps[currentStep]}
                    </h2>
                    <p className="text-muted-foreground text-sm font-mono opacity-60">
                        LATENCY: 12ms | BYTES: {Math.floor(progress * 12.4)}kb
                    </p>
                </div>

                {/* Progress Bar Container */}
                <div className="w-full bg-white/5 border border-white/10 rounded-full h-1.5 mb-2 overflow-hidden backdrop-blur-sm">
                    <div
                        className="bg-primary h-full transition-all duration-75 ease-out shadow-[0_0_10px_#f97316]"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="flex justify-between w-full text-[10px] uppercase tracking-tighter text-muted-foreground font-bold">
                    <span>Initializing Sandbox</span>
                    <span>{progress}%</span>
                </div>
            </div>

            {/* Scanline effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-20" />
        </div>
    );
}
