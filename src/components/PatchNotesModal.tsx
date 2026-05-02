"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import {
  Rocket,
  Coffee,
  Zap,
  FileText,
  Mail,
  TrendingUp,
  Sparkles,
  Layers,
  CheckCircle2,
  X
} from 'lucide-react';

export const PatchNotesModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const PATCH_VERSION = '2.0.0';

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
      <div className="relative overflow-hidden rounded-2xl bg-white min-h-[600px]">
        {/* Premium Header Header */}
        <div className="relative h-48 bg-slate-900 overflow-hidden flex items-center px-10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-transparent to-purple-600/20"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>

          <div className="relative z-10 flex items-center gap-6">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 ring-4 ring-blue-500/20">
              <Rocket className="w-10 h-10 animate-bounce duration-[3000ms]" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] rounded-full border border-blue-500/30">
                  Major Update
                </span>
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Version {PATCH_VERSION}</span>
              </div>
              <h2 className="text-4xl font-black text-white tracking-tight">System Upgrade</h2>
              <p className="text-slate-400 text-sm font-medium mt-2 max-w-md">
                We've enhanced your workspace with powerful new tools and a smoother interface designed for maximum productivity.
              </p>
            </div>
          </div>
        </div>

        <div className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Dashboard */}
            <div className="group p-6 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 hover:border-blue-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="font-black text-slate-800 tracking-tight">Monthly Intelligence</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-bold italic">
                Visualize your performance with new monthly charts! Track the exact number of **Running, Pending, and Completed** tasks across all your report types.
              </p>
            </div>



            {/* 3. Workflow */}
            <div className="group p-6 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 hover:border-blue-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="font-black text-slate-800 tracking-tight">No-Reload Saving</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-bold italic">
                Saving no longer refreshes the page! Stay on your active task sheet and **continue your work immediately** without losing your position.
              </p>
            </div>

            {/* 4. Automation */}
            <div className="group p-6 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 hover:border-blue-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-black text-slate-800 tracking-tight">Smart Defaults</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-bold italic">
                The system now selects your project **automatically based on your job role** (Developer, Sales, etc.). Save time with every new entry.
              </p>
            </div>

            {/* 5. Details */}
            <div className="group p-6 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 hover:border-blue-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="font-black text-slate-800 tracking-tight">Better Visibility</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-bold italic">
                We've **increased the narrative area by 33%** and added "Total Hours" to history. Project lists now sort your most used items to the end.
              </p>
            </div>

            {/* 6. Communication */}
            <div className="group p-6 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 hover:border-blue-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-pink-600 group-hover:text-white transition-all shadow-sm">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="font-black text-slate-800 tracking-tight">Dispatch Status</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-bold italic">
                Avoid duplicate emails with clear **"Report Dispatched"** alerts and green "Sent" badges in your history for complete clarity.
              </p>
            </div>

            {/* 7. Sorting */}
            <div className="group p-6 rounded-2xl bg-slate-900 border border-slate-800 transition-all hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-500/50 lg:col-span-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/20">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-white tracking-tight">Smart Selection Sorting</h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-bold italic mt-1">
                      Selected clients move to the bottom of the list to stay out of your way, while appearing first in your reports.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-500 hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2 group/btn whitespace-nowrap"
                >
                  <CheckCircle2 className="w-4 h-4 text-white group-hover/btn:scale-110 transition-transform" />
                  Explore Version {PATCH_VERSION}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
