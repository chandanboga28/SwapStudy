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
        className="flex min-h-screen w-full items-center justify-center bg-[#F5F8FF]"
        role="status"
        aria-label="Checking session"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#DCE7FF] border-t-[#2855D9]" />
          <span className="text-xs font-semibold tracking-wide text-[#17213A]">
            SwapStudy
          </span>
        </div>
      </div>
    );
  }

  return <CinematicIntroExperience />;
}
