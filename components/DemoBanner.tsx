'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, X, ChevronDown } from 'lucide-react';

const emptySubscribe = () => () => {};

export default function DemoBanner() {
  const { user, allUsers, switchDemoUser, isDemoMode } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!mounted || !isDemoMode || isDismissed) return null;

  return (
    <div className="bg-[#111110] text-[#F7F5F0] border-b border-[#37332E] px-4 py-2.5 text-sm z-50 relative">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-[#AAA69F]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2B2824] border border-[#37332E] text-[#FF9B45] px-2.5 py-0.5 font-bold text-xs tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Demo Mode
          </span>
          <span className="hidden sm:inline text-sm">
            SwapStudy works offline in preview mode. All actions run locally.
          </span>
          <span className="sm:hidden text-xs">Local Preview Mode</span>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#AAA69F] hidden md:inline">Active profile:</span>
            <div className="relative">
              <select
                value={user?.id || ''}
                onChange={(e) => switchDemoUser(e.target.value)}
                aria-label="Switch demo profile"
                className="appearance-none bg-[#22211F] hover:bg-[#2B2824] border border-[#37332E] text-[#F7F5F0] font-semibold rounded-xl pl-3 pr-8 py-1.5 text-xs focus:outline-none focus:border-[#FF9B45] cursor-pointer transition-colors"
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id} className="bg-[#22211F] text-[#F7F5F0]">
                    {u.name} ({u.credits} credits)
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#AAA69F] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <button
            onClick={() => setIsDismissed(true)}
            className="text-[#AAA69F] hover:text-[#F7F5F0] p-1 rounded-lg hover:bg-[#22211F] transition-colors"
            title="Dismiss notice"
            aria-label="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
