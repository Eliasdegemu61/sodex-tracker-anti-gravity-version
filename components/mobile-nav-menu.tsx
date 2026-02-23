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
        className="md:hidden h-9 w-9 text-muted-foreground hover:text-foreground"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm md:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <div
        ref={menuRef}
        className={`fixed top-20 right-6 left-6 bg-card/90 backdrop-blur-2xl border border-border/20 rounded-[2.5rem] shadow-2xl transition-all duration-300 z-40 xl:hidden ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 invisible'
          }`}
      >
        <div className="p-6 grid grid-cols-1 gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 ${isActive
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-muted-foreground/60 hover:text-foreground hover:bg-secondary/10 border border-transparent'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-orange-400/60'}`} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] italic">{item.label}</span>
                </div>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              </button>
            );
          })}

          <div className="mt-4 pt-4 border-t border-border/10">
            <a href="https://sodex.com/join/TRADING" target="_blank" rel="noopener noreferrer">
              <Button className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] italic shadow-lg shadow-orange-500/20">
                Execute Trade
              </Button>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
