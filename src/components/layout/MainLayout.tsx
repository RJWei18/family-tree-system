import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, Network, Menu, X, Calendar, Moon, Sun } from 'lucide-react';
import { useFamilyStore } from '../../store/useFamilyStore';

interface MainLayoutProps {
  children: React.ReactNode;
  currentView: 'members' | 'tree' | 'calendar';
  onViewChange: (view: 'members' | 'tree' | 'calendar') => void;
  onToggleCalculator: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, currentView, onViewChange, onToggleCalculator }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isDarkMode = useFamilyStore((state) => state.isDarkMode);
  const toggleTheme = useFamilyStore((state) => state.toggleTheme);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Lock viewport height for Tree view to prevent window scroll interference with React Flow
  useEffect(() => {
    if (currentView === 'tree') {
      document.body.classList.add('app-fixed-height');
    } else {
      document.body.classList.remove('app-fixed-height');
    }
    return () => {
      document.body.classList.remove('app-fixed-height');
    };
  }, [currentView]);

  const handleNavClick = (view: 'members' | 'tree' | 'calendar') => {
    onViewChange(view);
    setIsMobileMenuOpen(false);
  };

  // Mobile Menu Drawer Portal
  const mobileMenu = isMobileMenuOpen && mounted ? (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        isolation: 'isolate',
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}
      className="md:hidden"
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)', // Lighter backdrop
          backdropFilter: 'blur(4px)'
        }}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Drawer Content */}
      <div
        style={{
          position: 'relative',
          width: '85%',
          maxWidth: '320px',
          height: '100%',
          backgroundColor: '#ffffff', // White bg
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '10px 0 25px -5px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-[var(--text-main)]">FamilyConnect</h2>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={28} />
          </button>
        </div>

        <nav className="flex flex-col gap-3 p-4">
          <button
            onClick={() => handleNavClick('members')}
            className={`flex items-center gap-4 p-4 rounded-xl text-lg font-medium transition-all ${currentView === 'members'
              ? 'bg-[var(--accent)] text-[#5D4037]'
              : 'hover:bg-slate-50 text-[var(--text-muted)]'
              }`}
          >
            <Users size={24} className="shrink-0" />
            <span className="truncate">成員管理</span>
          </button>
          <button
            onClick={() => handleNavClick('tree')}
            className={`flex items-center gap-4 p-4 rounded-xl text-lg font-medium transition-all ${currentView === 'tree'
              ? 'bg-[var(--accent)] text-[#5D4037]'
              : 'hover:bg-slate-50 text-[var(--text-muted)]'
              }`}
          >
            <Network size={24} className="shrink-0" />
            <span className="truncate">家族樹狀圖</span>
          </button>
          <button
            onClick={() => handleNavClick('calendar')}
            className={`flex items-center gap-4 p-4 rounded-xl text-lg font-medium transition-all ${currentView === 'calendar'
              ? 'bg-[var(--accent)] text-[#5D4037]'
              : 'hover:bg-slate-50 text-[var(--text-muted)]'
              }`}
          >
            <Calendar size={24} className="shrink-0" />
            <span className="truncate">壽星月曆</span>
          </button>
        </nav>

        <div className="mt-auto p-6 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 text-slate-500 font-medium"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            {isDarkMode ? '切換亮色模式' : '切換深色模式'}
          </button>
          <p className="text-xs text-slate-400">v1.0.4</p>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-main)] font-sans">
      {/* Sticky Top Header (Desktop & Mobile) */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/70 dark:bg-slate-900/80 border-b border-[var(--border-color)] shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Logo Area */}
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
              <span className="text-2xl">🌳</span>
              <span>FamilyConnect</span>
            </h1>
          </div>

          {/* Desktop Navigation (Centered Tabs) */}
          <nav className="hidden md:flex items-center gap-2">
            {[
              { id: 'members', label: '成員管理', icon: Users },
              { id: 'tree', label: '家族樹', icon: Network },
              { id: 'calendar', label: '壽星月曆', icon: Calendar },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id as any)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm font-medium
                  ${currentView === item.id
                    ? 'bg-[var(--accent)] text-[#5D4037] shadow-sm'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)]'}
                `}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] transition-colors"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-full hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)]"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Render Mobile Menu via Portal */}
      {mounted && mobileMenu && createPortal(mobileMenu, document.body)}

      {/* Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col relative">
        <div className="glass-panel rounded-2xl shadow-lg border border-white/50 relative bg-white/50 flex flex-col flex-1">
          {children}
        </div>
      </main>

      {/* Floating Tool Button - Uses Portal to escape container context (backdrop-filter) */}
      {mounted && createPortal(
        <div
          className="fixed z-[99999] pointer-events-auto"
          style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999 }}
        >
          <button
            onClick={() => {
              console.log('Calculator button clicked');
              onToggleCalculator();
            }}
            className="p-4 bg-violet-600 hover:bg-violet-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center animate-bounce-slow"
            title="開啟稱謂計算機"
            style={{ animationDuration: '3s' }}
          >
            <div className="relative">
              <Calendar size={24} className="hidden" /> {/* Dummy to keep import valid if needed */}
              {/* Calculator Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" /><line x1="8" x2="16" y1="6" y2="6" /><line x1="16" x2="16" y1="14" y2="18" /><path d="M16 10h.01" /><path d="M12 10h.01" /><path d="M8 10h.01" /><path d="M12 14h.01" /><path d="M8 14h.01" /><path d="M12 18h.01" /><path d="M8 18h.01" /></svg>
            </div>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};
