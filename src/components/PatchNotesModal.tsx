"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import {
  Rocket,
  Coffee,
  Zap,
  TrendingUp,
  Sparkles,
  Layers,
  CheckCircle2,
  X
} from 'lucide-react';

export const PatchNotesModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const PATCH_VERSION = '2.1.0';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const seenVersion = localStorage.getItem('last_seen_patch');
      if (seenVersion !== PATCH_VERSION) {
        // Delay slightly for better UX
        const timer = setTimeout(() => setIsOpen(true), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('last_seen_patch', PATCH_VERSION);
    setIsOpen(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="" size="3xl" bodyClassName="p-0" hideHeader={true}>
      <div className="relative overflow-hidden rounded-none bg-white min-h-[600px]">
        {/* Premium Header Header */}
        <div className="relative h-48 bg-slate-900 overflow-hidden flex items-center px-10 text-left">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-transparent to-purple-600/20"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>

          <div className="relative z-10 flex items-center gap-6">
            <div className="w-20 h-20 bg-blue-600 rounded-none flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 ring-4 ring-blue-500/20">
              <Sparkles className="w-10 h-10" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-white tracking-tight uppercase">What's New</h1>
                <span className="px-3 py-1 bg-blue-500 text-white text-[10px] font-black rounded-none uppercase tracking-widest ring-1 ring-white/20">v{PATCH_VERSION}</span>
              </div>
              <p className="text-blue-100/60 font-medium mt-1 italic">Dashboard Evolution & Square Design Overhaul</p>
            </div>
          </div>

          <button onClick={handleClose} className="absolute top-6 right-6 p-2 text-white/40 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-10 space-y-10 max-h-[500px] overflow-y-auto custom-scrollbar text-left">
          {/* Dashboard Evolution Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-none text-blue-600">
                <Layers className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Dashboard UX Evolution</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-none group hover:bg-white hover:shadow-xl transition-all">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-none group-hover:scale-110 transition-transform flex-shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase">Integrated Drill-Down</h3>
                    <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">Task details now expand seamlessly below the cards with automatic scrolling—no more popups.</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border border-slate-100 rounded-none group hover:bg-white hover:shadow-xl transition-all">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-none group-hover:scale-110 transition-transform flex-shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase">Sharp Square Design</h3>
                    <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">Removed all border radii for a crisp, high-end "Square Design" look across cards and badges.</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border border-slate-100 rounded-none group hover:bg-white hover:shadow-xl transition-all">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-none group-hover:scale-110 transition-transform flex-shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase">Dynamic Backgrounds</h3>
                    <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">Header badges and task counters now use vibrant dynamic colors that match the selected status.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Coffee className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest"></span>
          </div>
          <button
            onClick={handleClose}
            className="px-8 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-[0.2em] rounded-none hover:bg-slate-800 transition-all hover:translate-y-[-2px] active:translate-y-0 shadow-lg shadow-slate-200"
          >
            Got it, Let's go!
          </button>
        </div>
      </div>
    </Modal>
  );
};
