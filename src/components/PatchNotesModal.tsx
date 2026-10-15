"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import {
  Coffee,
  Sparkles,
  X,
  Mail,
  CheckCircle2,
  MessageSquare,
  SlidersHorizontal,
  BarChart3
} from 'lucide-react';

export const PatchNotesModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const PATCH_VERSION = '2.4.0';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const seenVersion = localStorage.getItem('last_seen_patch');
      if (seenVersion !== PATCH_VERSION) {
        // Delay slightly for better UX
        const timer = setTimeout(() => setIsOpen(true), 1200);
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
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-2xl">
        {/* Premium Header */}
        <div className="relative min-h-[140px] sm:h-44 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 overflow-hidden flex items-center p-4 sm:px-10 text-left">
          <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/15 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>

          <div className="relative z-10 flex items-center gap-3.5 sm:gap-6 pr-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 ring-4 ring-indigo-500/20">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight uppercase">Release Notes</h1>
                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-[10px] sm:text-[11px] font-black rounded-md uppercase tracking-widest ring-1 ring-white/20 shadow-sm">
                  v{PATCH_VERSION}
                </span>
              </div>
              <p className="text-indigo-200/80 font-medium mt-1 text-xs sm:text-sm">
                Unified System Messaging, Smart Email Actions, & Keyboard Shortcuts
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="absolute top-3.5 right-3.5 sm:top-6 sm:right-6 p-1.5 sm:p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-8 space-y-4 sm:space-y-6 max-h-[60vh] sm:max-h-[500px] overflow-y-auto custom-scrollbar text-left">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                Key Updates & Changes in v{PATCH_VERSION}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Feature 1: Standardized Notifications & Alerts */}
              <div className="p-5 bg-slate-50/80 border border-slate-100 rounded-xl group hover:bg-white hover:border-emerald-200 hover:shadow-lg transition-all flex flex-col justify-between">
                <div>
                  <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform w-fit mb-3.5">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-sm font-black text-slate-900 uppercase">Unified System Messaging</h3>
                  </div>
                  <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 mb-2">UI / UX</span>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Standardized all user-facing notifications, validation errors, and confirmation dialogs across all 13 modules. Destructive actions now consistently prompt with clear consequence messages and dedicated <code className="text-emerald-700 font-mono text-[10px] bg-emerald-50 px-1 py-0.5 rounded">Delete</code> buttons.
                  </p>
                </div>
              </div>

              {/* Feature 2: Smart Email Services & Dynamic Actions */}
              <div className="p-5 bg-slate-50/80 border border-slate-100 rounded-xl group hover:bg-white hover:border-blue-200 hover:shadow-lg transition-all flex flex-col justify-between">
                <div>
                  <div className="p-2.5 bg-blue-100 text-blue-600 rounded-lg group-hover:scale-110 transition-transform w-fit mb-3.5">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-sm font-black text-slate-900 uppercase">Smart Email Integration</h3>
                  </div>
                  <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 mb-2">WORKFLOW</span>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    The <span className="font-semibold text-slate-700">"Send Mail"</span> action and preview modal <span className="font-semibold text-slate-700">"Send Report Now"</span> buttons dynamically check SMTP settings and only appear when email services are active.
                  </p>
                </div>
              </div>

              {/* Feature 3: Modal & Keyboard Ergonomics */}
              <div className="p-5 bg-slate-50/80 border border-slate-100 rounded-xl group hover:bg-white hover:border-amber-200 hover:shadow-lg transition-all flex flex-col justify-between">
                <div>
                  <div className="p-2.5 bg-amber-100 text-amber-600 rounded-lg group-hover:scale-110 transition-transform w-fit mb-3.5">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-sm font-black text-slate-900 uppercase">Keyboard Shortcuts (ESC & Enter)</h3>
                  </div>
                  <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100 mb-2">ACCESSIBILITY</span>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Confirmation dialogs now reliably close on <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono shadow-2xs font-bold text-slate-700">ESC</kbd> and confirm on <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono shadow-2xs font-bold text-slate-700">ENTER</kbd> in capture phase, even while child inputs have focus.
                  </p>
                </div>
              </div>

              {/* Feature 4: Date Formatting & Archive Refinements */}
              <div className="p-5 bg-slate-50/80 border border-slate-100 rounded-xl group hover:bg-white hover:border-purple-200 hover:shadow-lg transition-all flex flex-col justify-between">
                <div>
                  <div className="p-2.5 bg-purple-100 text-purple-600 rounded-lg group-hover:scale-110 transition-transform w-fit mb-3.5">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-sm font-black text-slate-900 uppercase">Standardized Date & Reports</h3>
                  </div>
                  <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-100 mb-2">REPORTS</span>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Standardized international date formatting to <span className="font-mono font-bold text-slate-800">DD/MM/YYYY</span> across Daily Task Sheet and Work Report archive explorers, with updated status badges.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Summary Pill List */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Additional Improvements
              </h4>
              <ul className="text-xs text-slate-600 space-y-1.5 pl-6 list-disc">
                <li>Standardized international date formatting to <span className="font-mono font-bold text-slate-800">DD/MM/YYYY</span> across Daily Task Sheet and Work Report archive explorers.</li>
                <li>Updated email dispatch indicator badge wording from <em>"Mail Dispatched"</em> to <em>"Mail Sent"</em>.</li>
                <li>Smart SMTP check: <em>"Send Mail"</em> and preview modal <em>"Send Report Now"</em> buttons now dynamically show only when email services are active.</li>
                <li>Added auto-dismiss for top navigation user profile menus on outside click.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 sm:px-8 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/60">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <Coffee className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              DailyTaskSheet Engine v{PATCH_VERSION}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="w-full sm:w-auto px-8 py-2.5 bg-slate-900 text-white text-xs font-black uppercase tracking-[0.15em] rounded-xl hover:bg-slate-800 transition-all hover:shadow-md active:scale-98 text-center"
          >
            Got it, Let's go!
          </button>
        </div>
      </div>
    </Modal>
  );
};
