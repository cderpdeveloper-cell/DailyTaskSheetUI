"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import {
  Coffee,
  Sparkles,
  X,
  Bot,
  Mail,
  ShieldCheck,
  Clock,
  Eye,
  RefreshCw,
  BarChart3,
  MousePointer,
  CheckCircle2
} from 'lucide-react';

export const PatchNotesModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const PATCH_VERSION = '2.3.1';

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
      <div className="relative overflow-hidden rounded-xl bg-white min-h-[520px] border border-slate-100 shadow-2xl">
        {/* Premium Header */}
        <div className="relative h-44 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 overflow-hidden flex items-center px-10 text-left">
          <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/15 blur-[90px] rounded-full -translate-y-1/2 translate-x-1/2"></div>

          <div className="relative z-10 flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 ring-4 ring-indigo-500/20">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-white tracking-tight uppercase">What's New</h1>
                <span className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-[11px] font-black rounded-md uppercase tracking-widest ring-1 ring-white/20 shadow-sm">
                  v{PATCH_VERSION}
                </span>
              </div>
              <p className="text-indigo-200/80 font-medium mt-1 text-sm">
                Auto-Dismiss UI, Dashboard Count Sync & AI Tracking
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="absolute top-6 right-6 p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-8 space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar text-left">
          {/* Main Feature Highlight Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                Latest System Enhancements
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Feature 1: Auto Dismiss Dropdowns */}
              <div className="p-5 bg-slate-50/80 border border-slate-100 rounded-xl group hover:bg-white hover:border-blue-200 hover:shadow-lg transition-all flex flex-col justify-between">
                <div>
                  <div className="p-2.5 bg-blue-100 text-blue-600 rounded-lg group-hover:scale-110 transition-transform w-fit mb-3.5">
                    <MousePointer className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-sm font-black text-slate-900 uppercase">Auto-Dismiss On Outside Click</h3>
                  </div>
                  <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 mb-2">NEW</span>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Top bar profile menus and popup dropdowns automatically close when clicking anywhere outside on the screen for a cleaner desktop workflow.
                  </p>
                </div>
              </div>

              {/* Feature 2: Dashboard Stats & Period Sync */}
              <div className="p-5 bg-slate-50/80 border border-slate-100 rounded-xl group hover:bg-white hover:border-amber-200 hover:shadow-lg transition-all flex flex-col justify-between">
                <div>
                  <div className="p-2.5 bg-amber-100 text-amber-600 rounded-lg group-hover:scale-110 transition-transform w-fit mb-3.5">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-sm font-black text-slate-900 uppercase">Dashboard Count & Filter Sync</h3>
                  </div>
                  <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100 mb-2">IMPROVED</span>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Status count cards dynamically re-aggregate by selected month/year with historical task visibility preserved even if clients or projects are archived.
                  </p>
                </div>
              </div>

              {/* Feature 3: AI Assistance Tracking */}
              <div className="p-5 bg-slate-50/80 border border-slate-100 rounded-xl group hover:bg-white hover:border-purple-200 hover:shadow-lg transition-all flex flex-col justify-between">
                <div>
                  <div className="p-2.5 bg-purple-100 text-purple-600 rounded-lg group-hover:scale-110 transition-transform w-fit mb-3.5">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-sm font-black text-slate-900 uppercase">AI Tracking & Template Tags</h3>
                  </div>
                  <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-100 mb-2">NEW</span>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Track AI usage and specific models in Daily Task Sheets with dynamic <code className="text-purple-600 font-mono text-[11px] bg-purple-50 px-1 py-0.5 rounded">&#123;&#123;IsAiUsed&#125;&#125;</code> and <code className="text-purple-600 font-mono text-[11px] bg-purple-50 px-1 py-0.5 rounded">&#123;&#123;AiModel&#125;&#125;</code> email tags.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 px-8 border-t border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <Coffee className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              DailyTaskSheet Engine v{PATCH_VERSION}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="px-8 py-2.5 bg-slate-900 text-white text-xs font-black uppercase tracking-[0.15em] rounded-lg hover:bg-slate-800 transition-all hover:shadow-md active:scale-98"
          >
            Got it, Let's go!
          </button>
        </div>
      </div>
    </Modal>
  );
};

