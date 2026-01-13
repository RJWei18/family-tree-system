import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, Network, Menu, X, Calendar, Moon, Sun } from 'lucide-react';
import { useFamilyStore } from '../../store/useFamilyStore';

interface MainLayoutProps {
  children: React.ReactNode;
  currentView: 'members' | 'tree' | 'calendar';
  onViewChange: (view: 'members' | 'tree' | 'calendar') => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, currentView, onViewChange }) => {
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
          <h2 className="text-xl font-bold heading-gradient">FamilyConnect</h2>
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
              ? 'bg-violet-50 text-violet-700 border border-violet-100'
              : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
              }`}
          >
            <Users size={24} className="shrink-0" />
            <span className="truncate">成員管理</span>
          </button>
          <button
            onClick={() => handleNavClick('tree')}
            className={`flex items-center gap-4 p-4 rounded-xl text-lg font-medium transition-all ${currentView === 'tree'
              ? 'bg-violet-50 text-violet-700 border border-violet-100'
              : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
              }`}
          >
            <Network size={24} className="shrink-0" />
            <span className="truncate">家族樹狀圖</span>
          </button>
          <button
            onClick={() => handleNavClick('calendar')}
            className={`flex items-center gap-4 p-4 rounded-xl text-lg font-medium transition-all ${currentView === 'calendar'
              ? 'bg-violet-50 text-violet-700 border border-violet-100'
              : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
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
    <div className="flex flex-col md:flex-row w-full h-full bg-[var(--bg-main)] text-[var(--text-main)] font-sans overflow-hidden">

      {/* Mobile Header - Bright & Clean */}
      <div className="md:hidden flex items-center justify-between p-4 px-5 border-b border-slate-200 bg-white/90 backdrop-blur-sm shrink-0 z-30 sticky top-0 shadow-sm">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold heading-gradient">FamilyConnect</h1>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2.5 -mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600 active:scale-95 touch-manipulation z-40 relative"
          aria-label="開啟選單"
        >
          <Menu size={28} />
        </button>
      </div>

      {/* Render Mobile Menu via Portal */}
      {mounted && mobileMenu && createPortal(mobileMenu, document.body)}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 glass-panel m-4 flex-col p-5 gap-6 border-r-0 shrink-0 bg-white/60 dark:bg-slate-800/80 dark:border dark:border-slate-700">
        <div className="px-2 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold heading-gradient mb-1">
              FamilyConnect
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">家族系譜管理系統</p>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <nav className="flex flex-col gap-3 mt-4">
          <button
            onClick={() => handleNavClick('members')}
            className={`flex items-center gap-3 p-3.5 rounded-xl transition-all font-medium ${currentView === 'members'
              ? 'bg-gradient-to-r from-violet-50 to-white text-violet-700 shadow-sm border border-violet-100'
              : 'hover:bg-white/50 text-slate-500 hover:text-slate-800'
              }`}
          >
            <Users size={20} />
            成員管理
          </button>
          <button
            onClick={() => handleNavClick('tree')}
            className={`flex items-center gap-3 p-3.5 rounded-xl transition-all font-medium ${currentView === 'tree'
              ? 'bg-gradient-to-r from-violet-50 to-white text-violet-700 shadow-sm border border-violet-100'
              : 'hover:bg-white/50 text-slate-500 hover:text-slate-800'
              }`}
          >
            <Network size={20} />
            家族樹狀圖
          </button>
          <button
            onClick={() => handleNavClick('calendar')}
            className={`flex items-center gap-3 p-3.5 rounded-xl transition-all font-medium ${currentView === 'calendar'
              ? 'bg-gradient-to-r from-violet-50 to-white text-violet-700 shadow-sm border border-violet-100'
              : 'hover:bg-white/50 text-slate-500 hover:text-slate-800'
              }`}
          >
            <Calendar size={20} />
            壽星月曆
          </button>
        </nav>
      </aside>

      {/* Content Area - Clean White Card */}
      <main className="flex-1 md:m-4 md:ml-0 m-0 glass-panel md:rounded-2xl rounded-none border-x-0 md:border-x border-b-0 md:border-b overflow-hidden relative shadow-xl flex flex-col z-0 bg-white/80">
        {children}
      </main>
    </div>
  );
};
