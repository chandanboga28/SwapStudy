'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import CinematicIntroExperience from '@/components/intro/CinematicIntroExperience';

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/dashboard');
    }
  }, [isLoading, user, router]);

  // Keep server render, initial hydration pass, and unresolved/authenticated sessions
  // aligned on a quiet neutral screen so hydration never mismatches and intro never flashes.
  if (!isHydrated || isLoading || user) {
    return (
      <div
        className="flex min-h-screen w-full items-center justify-center bg-[#171715]"
        role="status"
        aria-label="Checking session"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#37332E] border-t-[#F1ECE5]" />
          <span className="text-xs font-medium tracking-wide text-[#9A958D]">
            SwapStudy
          </span>
        </div>
      </div>
    );
  }

  return <CinematicIntroExperience />;
}
