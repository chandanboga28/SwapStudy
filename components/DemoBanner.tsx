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
    <div className="bg-[#25282E] text-[#F2EFE8] border-b-[1.5px] border-[#4A4E57] px-4 py-2 text-sm z-50 relative">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-[#D2D6DF]">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#DCEB8E] border border-[#4A4E57] text-[#1F2227] px-2.5 py-0.5 font-mono font-bold text-[11px] tracking-wide uppercase">
            <Sparkles className="w-3 h-3" />
            Demo_Mode
          </span>
          <span className="hidden sm:inline text-xs font-medium text-[#E5E8EE]">
            SwapStudy is running in local preview mode. All actions run safely in your browser.
          </span>
          <span className="sm:hidden text-xs text-[#E5E8EE]">Local Preview</span>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#C4C8D1] hidden md:inline">PROFILE:</span>
            <div className="relative">
              <select
                value={user?.id || ''}
                onChange={(e) => switchDemoUser(e.target.value)}
                aria-label="Switch demo profile"
                className="appearance-none bg-[#32363F] hover:bg-[#3B404B] border border-[#5B606B] text-[#F2EFE8] font-semibold rounded-lg pl-3 pr-8 py-1 text-xs focus:outline-none focus:border-[#DCEB8E] cursor-pointer transition-colors"
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id} className="bg-[#25282E] text-[#F2EFE8]">
                    {u.name} ({u.credits} cr)
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#D2D6DF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <button
            onClick={() => setIsDismissed(true)}
            className="text-[#C4C8D1] hover:text-[#FFFFFF] p-1 rounded-lg hover:bg-[#32363F] transition-colors cursor-pointer"
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
