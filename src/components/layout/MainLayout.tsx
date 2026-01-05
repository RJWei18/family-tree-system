import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, Network, Menu, X } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
  currentView: 'members' | 'tree';
  onViewChange: (view: 'members' | 'tree') => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, currentView, onViewChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNavClick = (view: 'members' | 'tree') => {
    onViewChange(view);
    setIsMobileMenuOpen(false);
  };

  // Mobile Menu Drawer Portal - INLINE STYLES FOR SAFETY
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
           {/* Backdrop - Manual Style */}
           <div 
             style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(8px)'
             }}
             onClick={() => setIsMobileMenuOpen(false)}
           />

           {/* Drawer Content - Manual Style */}
           <div 
             style={{
                position: 'relative',
                width: '85%',
                maxWidth: '320px',
                height: '100%',
                backgroundColor: '#0f172a',
                borderRight: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
             }}
           >
              <div className="flex justify-between items-center p-6 border-b border-white/5">
                 <h2 className="text-xl font-bold heading-gradient">FamilyConnect</h2>
                 <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                 >
                    <X size={28} />
                 </button>
              </div>
              
              <nav className="flex flex-col gap-3 p-4">
                 <button
                    onClick={() => handleNavClick('members')}
                    className={`flex items-center gap-4 p-4 rounded-xl text-lg font-medium transition-all ${
                    currentView === 'members' 
                        ? 'bg-violet-600/20 text-violet-200 border border-violet-500/20' 
                        : 'hover:bg-white/5 text-slate-400 hover:text-white'
                    }`}
                 >
                    <Users size={24} className="shrink-0" />
                    <span className="truncate">成員管理</span>
                 </button>
                 <button
                    onClick={() => handleNavClick('tree')}
                    className={`flex items-center gap-4 p-4 rounded-xl text-lg font-medium transition-all ${
                    currentView === 'tree' 
                        ? 'bg-violet-600/20 text-violet-200 border border-violet-500/20' 
                        : 'hover:bg-white/5 text-slate-400 hover:text-white'
                    }`}
                 >
                    <Network size={24} className="shrink-0" />
                    <span className="truncate">家族樹狀圖</span>
                 </button>
              </nav>

              <div className="mt-auto p-6 border-t border-white/5">
                  <p className="text-xs text-slate-500 text-center">Version 1.0.3</p>
              </div>
           </div>
      </div>
  ) : null;

  return (
    <div className="flex flex-col md:flex-row w-full h-full bg-[var(--bg-dark)] text-[var(--text-main)] font-sans overflow-hidden">
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 px-5 border-b border-white/10 bg-[#0f172a]/95 backdrop-blur-sm shrink-0 z-30 sticky top-0 shadow-md">
         <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold heading-gradient">FamilyConnect</h1>
         </div>
         <button 
           onClick={() => {
               console.log('Mobile menu clicked');
               setIsMobileMenuOpen(true);
           }}
           className="p-2.5 -mr-2 hover:bg-white/10 rounded-full transition-colors text-white active:scale-95 touch-manipulation z-40 relative"
           aria-label="開啟選單"
         >
           <Menu size={28} />
         </button>
      </div>

      {/* Render Mobile Menu via Portal - only if open */}
      {mounted && mobileMenu && createPortal(mobileMenu, document.body)}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 glass-panel m-4 flex-col p-5 gap-6 border-r-0 shrink-0">
        <div className="px-2">
            <h1 className="text-2xl font-bold heading-gradient mb-1">
            FamilyConnect
            </h1>
            <p className="text-xs text-slate-400">家族系譜管理系統</p>
        </div>
        
        <nav className="flex flex-col gap-3 mt-4">
          <button
            onClick={() => handleNavClick('members')}
            className={`flex items-center gap-3 p-3.5 rounded-xl transition-all font-medium ${
              currentView === 'members' 
                ? 'bg-gradient-to-r from-violet-600/20 to-violet-600/10 text-violet-200 shadow-sm border border-violet-500/20' 
                : 'hover:bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <Users size={20} />
            成員管理
          </button>
          <button
            onClick={() => handleNavClick('tree')}
            className={`flex items-center gap-3 p-3.5 rounded-xl transition-all font-medium ${
              currentView === 'tree' 
                ? 'bg-gradient-to-r from-violet-600/20 to-violet-600/10 text-violet-200 shadow-sm border border-violet-500/20' 
                : 'hover:bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <Network size={20} />
            家族樹狀圖
          </button>
        </nav>
      </aside>

      {/* Content Area */}
      <main className="flex-1 md:m-4 md:ml-0 m-0 glass-panel md:rounded-2xl rounded-none border-x-0 md:border-x border-b-0 md:border-b overflow-hidden relative shadow-2xl flex flex-col z-0">
        {children}
      </main>
    </div>
  );
};
