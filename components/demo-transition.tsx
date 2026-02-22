'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface DemoTransitionProps {
    onComplete: () => void;
}

export function DemoTransition({ onComplete }: DemoTransitionProps) {
    useEffect(() => {
        // Simple 1.5s delay for the "loading" feel
        const timer = setTimeout(onComplete, 1500);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-lg font-medium text-foreground animate-pulse">
                    Retrieving demo account data...
                </p>
            </div>
        </div>
    );
}
