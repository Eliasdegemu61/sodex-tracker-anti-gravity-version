'use client';

import { useState, useEffect, useRef } from 'react';
import { Menu, X, Activity, TrendingUp, Wallet, Trophy, Zap, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileNavMenuProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function MobileNavMenu({ currentPage, onNavigate }: MobileNavMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const navItems = [
    { id: 'dex-status', label: 'Dex Status', icon: Activity },
    { id: 'tracker', label: 'Address Tracker', icon: TrendingUp },
    { id: 'portfolio', label: 'Portfolio', icon: Wallet },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'analyzer', label: 'Analyzer', icon: Zap },
    { id: 'whale-tracker', label: 'Whale Tracker', icon: Zap },
    { id: 'about', label: 'What is SoDEX', icon: Info },
  ];

  const handleNavClick = (pageId: string) => {
    onNavigate(pageId);
    setIsOpen(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="xl:hidden h-9 w-9 text-muted-foreground hover:text-foreground"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm xl:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <div
        ref={menuRef}
        className={`fixed top-16 right-4 w-[240px] bg-card/95 backdrop-blur-2xl border border-border/20 rounded-3xl shadow-2xl transition-all duration-300 z-50 xl:hidden ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
          }`}
      >
        <div className="p-3 flex flex-col gap-1 max-h-[80vh] overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 ${isActive
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-muted-foreground/60 hover:text-foreground hover:bg-secondary/10 border border-transparent'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-orange-400/60'}`} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em]">{item.label}</span>
                </div>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

