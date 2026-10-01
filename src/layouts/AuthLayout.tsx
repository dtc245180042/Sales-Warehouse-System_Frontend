import React from 'react';
import { Outlet } from 'react-router-dom';
import { Warehouse, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const AuthLayout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Theme Switcher absolute */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-all"
          title="Chuyển chế độ sáng/tối"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
        </button>
      </div>

      {/* Left Column (Brand Showcase) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-950 p-12 text-white flex-col items-center justify-center overflow-hidden">
        {/* Background glow and subtle patterns */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Centered Brand */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl mb-6">
            <Warehouse className="w-10 h-10 text-indigo-300" />
          </div>
          <h1 className="text-4xl xl:text-5xl font-black tracking-tight text-white mb-2">
            KhoVận Pro
          </h1>
          <span className="text-sm uppercase tracking-widest text-indigo-300 font-semibold">
            ENTERPRISE OMS SOLUTION
          </span>
        </div>

        {/* Footer info */}
        <div className="absolute bottom-6 left-12 right-12 z-10 flex items-center justify-center text-xs text-indigo-300/60 border-t border-white/10 pt-4">
          <span>© 2026 KhoVận Pro. All rights reserved.</span>
        </div>
      </div>

      {/* Right Column (Form Area) */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
