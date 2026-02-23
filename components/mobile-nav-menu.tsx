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
      {/* Hamburger Button */}
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="xl:hidden h-9 w-9 text-muted-foreground hover:text-foreground"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Full-screen overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] xl:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Bottom sheet menu */}
      <div
        ref={menuRef}
        className={`fixed bottom-0 left-0 right-0 z-[60] xl:hidden
          bg-[#111111]/98 backdrop-blur-2xl border-t border-white/10
          rounded-t-[2rem] shadow-2xl
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Nav items */}
        <div className="px-4 pb-8 flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-200
                  ${isActive
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-orange-400/50'}`} />
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em]">{item.label}</span>
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
