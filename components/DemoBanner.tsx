'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X } from 'lucide-react';

export default function DemoBanner() {
  const { user, allUsers, switchDemoUser, isDemoMode } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isDemoMode || isDismissed) return null;

  return (
    <div className="bg-slate-900 text-slate-300 px-4 py-1.5 text-xs border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="font-medium text-slate-200 flex items-center gap-1.5">
            <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
              Demo Sandbox
            </span>
            <span>Switch active student profile:</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            {allUsers.slice(0, 3).map((u) => {
              const isActive = user?.id === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => switchDemoUser(u.id)}
                  className={`px-2.5 py-0.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-800/80 hover:bg-slate-850 hover:text-white text-slate-300 border border-slate-700/60'
                  }`}
                  title={`${u.name} — ${u.major}`}
                >
                  {u.name.split(' ')[0]} <span className="opacity-75 text-[11px]">({u.credits} Cr)</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 text-slate-400 hover:text-slate-200 rounded transition-colors ml-1"
            title="Dismiss demo banner"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
