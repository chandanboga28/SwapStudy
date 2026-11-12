'use client';

import React, {
  Component,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  INTRO_FINAL_TAGLINE,
  INTRO_SCENES,
} from './introData';
import IntroFallbackVisual from './IntroFallbackVisual';

const DynamicIntroSceneStage = dynamic(() => import('./IntroSceneStage'), {
  ssr: false,
  loading: () => <IntroFallbackVisual activeScene={0} />,
});

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class StageErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function detectWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2', { powerPreference: 'high-performance' }) ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    return Boolean(gl);
  } catch {
    return false;
  }
}

const SCENE_STAGE_BACKDROPS = [
  {
    photo: '/intro/campus-library.jpg',
    pageBg: 'bg-[#FFFDF8]',
    glowTopRight: 'bg-[#FFF1AD]/55',
    glowBottomRight: 'bg-[#DCE7FF]/40',
    glowBottomLeft: 'bg-[#FFE58F]/35',
    scrimClass: 'bg-gradient-to-b from-[#FFFDF7]/35 via-[#FFF9EB]/48 to-[#FAF3DF]/90',
  },
  {
    photo: '/intro/campus-coffee.jpg',
    pageBg: 'bg-[#F7FAFF]',
    glowTopRight: 'bg-[#BFD4FF]/55',
    glowBottomRight: 'bg-[#DCE7FF]/55',
    glowBottomLeft: 'bg-[#FFF1AD]/30',
    scrimClass: 'bg-gradient-to-b from-[#EFF5FF]/30 via-[#F4F8FF]/44 to-[#E1ECFF]/90',
  },
  {
    photo: '/intro/campus-art.jpg',
    pageBg: 'bg-[#FFFEFA]',
    glowTopRight: 'bg-[#FFE58F]/45',
    glowBottomRight: 'bg-[#E2EFE0]/55',
    glowBottomLeft: 'bg-[#DCE7FF]/40',
    scrimClass: 'bg-gradient-to-b from-[#FFFDF5]/32 via-[#FFFFFF]/46 to-[#F2F0E8]/88',
  },
  {
    photo: '/intro/campus-lawn.jpg',
    pageBg: 'bg-[#F4F8FF]',
    glowTopRight: 'bg-[#CFE0FF]/60',
    glowBottomRight: 'bg-[#D7EAD4]/55',
    glowBottomLeft: 'bg-[#FFF1AD]/35',
    scrimClass: 'bg-gradient-to-b from-[#EEF5FF]/28 via-[#F3F8F2]/42 to-[#E2EFE0]/88',
  },
] as const;

export default function CinematicIntroExperience() {
  const router = useRouter();
  const [activeScene, setActiveScene] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  useEffect(() => {
    setWebglSupported(detectWebGLSupport());

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const viewportQuery = window.matchMedia('(max-width: 1023px)');

    const syncPreferences = () => {
      setReducedMotion(motionQuery.matches);
      setIsCompactViewport(viewportQuery.matches);
    };

    syncPreferences();

    motionQuery.addEventListener('change', syncPreferences);
    viewportQuery.addEventListener('change', syncPreferences);
    return () => {
      motionQuery.removeEventListener('change', syncPreferences);
      viewportQuery.removeEventListener('change', syncPreferences);
    };
  }, []);

  const totalScenes = INTRO_SCENES.length;
  const currentScene = INTRO_SCENES[activeScene] || INTRO_SCENES[0];
  const currentStageBackdrop = SCENE_STAGE_BACKDROPS[activeScene] || SCENE_STAGE_BACKDROPS[0];
  const isFinalScene = activeScene === totalScenes - 1;

  const handleSkipIntro = useCallback(() => {
    router.push('/login');
  }, [router]);

  const handleGetStarted = useCallback(() => {
    router.push('/signup');
  }, [router]);

  const goToScene = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(totalScenes - 1, index));
      setActiveScene(clamped);
    },
    [totalScenes]
  );

  const handleNext = useCallback(() => {
    if (activeScene < totalScenes - 1) {
      setActiveScene((prev) => Math.min(totalScenes - 1, prev + 1));
    }
  }, [activeScene, totalScenes]);

  const handlePrev = useCallback(() => {
    if (activeScene > 0) {
      setActiveScene((prev) => Math.max(0, prev - 1));
    }
  }, [activeScene]);

  // Auto-advance scenes smoothly until Scene 4 unless paused or reduced-motion is preferred.
  useEffect(() => {
    if (isPaused || reducedMotion || isFinalScene) return;

    const timeout = window.setTimeout(() => {
      setActiveScene((prev) => (prev < totalScenes - 1 ? prev + 1 : prev));
    }, currentScene.durationSeconds * 1000);

    return () => window.clearTimeout(timeout);
  }, [
    activeScene,
    currentScene.durationSeconds,
    isFinalScene,
    isPaused,
    reducedMotion,
    totalScenes,
  ]);

  // Keyboard navigation across desktop viewports.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleNext();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePrev();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        handleSkipIntro();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleNext, handlePrev, handleSkipIntro]);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.changedTouches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const startX = touchStartXRef.current;
    touchStartXRef.current = null;
    if (startX === null) return;
    const endX = event.changedTouches[0]?.clientX;
    if (typeof endX !== 'number') return;
    const delta = startX - endX;
    if (Math.abs(delta) < 42) return;
    if (delta > 0) {
      handleNext();
    } else {
      handlePrev();
    }
  };

  const fallbackStage = (
    <IntroFallbackVisual
      activeScene={activeScene}
      compact={isCompactViewport}
      reducedMotion={reducedMotion}
    />
  );

  const [sceneNum, sceneLabel] = currentScene.eyebrow.split(' · ');

  const renderHighlightedTitle = (title: string, highlight?: string) => {
    if (!highlight || !title.endsWith(highlight)) {
      return title;
    }
    const prefix = title.slice(0, title.length - highlight.length);
    return (
      <>
        {prefix}
        <span className="text-[#2855D9] underline decoration-[#FFD43B] decoration-[4px] underline-offset-[6px]">
          {highlight}
        </span>
      </>
    );
  };

  return (
    <div
      className={`relative flex min-h-screen w-full flex-col overflow-x-hidden ${currentStageBackdrop.pageBg} text-[#17213A] transition-colors duration-500 selection:bg-[#FFF1AD] selection:text-[#17213A]`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Scene-Responsive Soft Ambient Environment Blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className={`absolute -right-28 top-[-120px] h-[440px] w-[440px] rounded-full ${currentStageBackdrop.glowTopRight} blur-3xl transition-colors duration-700`}
        />
        <div
          className={`absolute bottom-[-140px] right-[12%] h-[360px] w-[360px] rounded-full ${currentStageBackdrop.glowBottomRight} blur-3xl transition-colors duration-700`}
        />
        <div
          className={`absolute -left-28 bottom-[-120px] h-[300px] w-[300px] rounded-full ${currentStageBackdrop.glowBottomLeft} blur-3xl transition-colors duration-700`}
        />
      </div>

      {/* Minimal Top Navigation Bar */}
      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-5 pb-3 pt-5 sm:px-8 sm:pt-7 lg:px-12">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2855D9] text-white shadow-[0_10px_24px_-8px_rgba(40,85,217,0.42)]"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 7h11l-3-3" />
              <path d="M17 17H6l3 3" stroke="#FFD43B" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[18px] font-extrabold tracking-tight text-[#17213A]">
              SwapStudy
            </span>
            <span className="hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64718A] sm:inline">
              Peer Skill Exchange
            </span>
          </div>
        </div>

        {/* Scene Step Pills (Desktop / Tablet) */}
        <nav
          aria-label="Onboarding scenes"
          className="hidden items-center gap-2 rounded-full border border-[#E5EAF5] bg-white/95 px-2.5 py-1.5 shadow-[0_8px_24px_-14px_rgba(40,85,217,0.16)] backdrop-blur-sm md:flex"
        >
          {INTRO_SCENES.map((scene, index) => {
            const isActive = index === activeScene;
            const isCompleted = index < activeScene;
            return (
              <button
                key={scene.id}
                type="button"
                onClick={() => goToScene(index)}
                aria-current={isActive ? 'step' : undefined}
                aria-label={`Scene ${index + 1}: ${scene.badgeText}`}
                className={`group relative flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-[#F5F8FF] text-[#183B9B] ring-1 ring-[#2855D9]/30 shadow-sm'
                    : isCompleted
                      ? 'bg-[#DCE7FF]/60 text-[#2855D9] hover:bg-[#DCE7FF]'
                      : 'text-[#2855D9]/80 hover:bg-[#F5F8FF] hover:text-[#2855D9]'
                }`}
              >
                {isActive && (
                  <span className="h-2 w-2 rounded-full bg-[#FFD43B]" aria-hidden="true" />
                )}
                <span className="text-[#2855D9]">0{index + 1}</span>
                {isActive && (
                  <span className="hidden xl:inline text-[#183B9B]">{scene.badgeText}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Playback Toggle + Skip Intro (White with Cobalt Blue Border) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {!reducedMotion && !isFinalScene && (
            <button
              type="button"
              onClick={() => setIsPaused((prev) => !prev)}
              aria-label={isPaused ? 'Resume intro playback' : 'Pause intro playback'}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#2855D9] bg-white text-[#2855D9] shadow-sm transition-colors hover:border-[#183B9B] hover:bg-[#F5F8FF] hover:text-[#183B9B]"
            >
              {isPaused ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                  <path d="M8 5.5v13l10.5-6.5L8 5.5z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                  <rect x="7" y="5.5" width="3.5" height="13" rx="1.2" />
                  <rect x="13.5" y="5.5" width="3.5" height="13" rx="1.2" />
                </svg>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleSkipIntro}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#2855D9] bg-white px-4 py-2 text-sm font-semibold text-[#2855D9] shadow-[0_6px_18px_-12px_rgba(40,85,217,0.2)] transition-all hover:border-[#183B9B] hover:bg-[#F5F8FF] hover:text-[#183B9B]"
          >
            <span>Skip Intro</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Responsive Split Canvas */}
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-5 pb-8 pt-2 sm:px-8 lg:px-12 lg:py-6">
        <div className="grid w-full grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Narrative Copy Column */}
          <div className="order-2 flex flex-col justify-center lg:order-1 lg:col-span-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentScene.id}
                initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
                transition={{ duration: reducedMotion ? 0.1 : 0.36, ease: 'easeOut' }}
                className="flex flex-col items-start"
              >
                {/* Eyebrow Badge */}
                <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-[#E5EAF5] bg-white px-3.5 py-1.5 shadow-[0_8px_20px_-14px_rgba(40,85,217,0.18)]">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: currentScene.accentColor }}
                  />
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#64718A]">
                    <span className="text-[#2855D9]">{sceneNum}</span>
                    {sceneLabel ? ` · ${sceneLabel}` : ''}
                  </span>
                </div>

                {/* Large Editorial Headline */}
                <h1 className="text-[34px] font-extrabold leading-[1.07] tracking-[-0.03em] text-[#17213A] sm:text-[44px] lg:text-[50px] xl:text-[58px]">
                  {renderHighlightedTitle(currentScene.title, currentScene.highlightText)}
                </h1>

                {/* Supporting Copy */}
                <p className="mt-5 max-w-xl text-[17px] leading-[1.6] text-[#64718A] sm:text-[19px] xl:text-[21px]">
                  {currentScene.subtitle}
                </p>

                {/* Final Scene Tagline Card */}
                {isFinalScene && (
                  <div className="mt-6 w-full rounded-2xl border border-[#E5EAF5] bg-white px-5 py-4 shadow-[0_14px_32px_-20px_rgba(40,85,217,0.22)]">
                    <p className="flex items-center gap-2.5 text-base font-bold tracking-tight text-[#17213A] sm:text-lg">
                      <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-[#FFD43B]" />
                      <span>{INTRO_FINAL_TAGLINE}</span>
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Timed Progress Bar + Navigation Actions */}
            <div className="mt-8 flex flex-col gap-5">
              {/* Progress Track: Active = Bright Yellow, Completed = Cobalt Blue, Inactive = Light Blue */}
              <div className="flex items-center gap-2">
                {INTRO_SCENES.map((scene, index) => {
                  const isActive = index === activeScene;
                  const isDone = index < activeScene;
                  return (
                    <button
                      key={scene.id}
                      type="button"
                      onClick={() => goToScene(index)}
                      aria-label={`Jump to ${scene.eyebrow}`}
                      className="relative h-2 flex-1 overflow-hidden rounded-full bg-[#DCE7FF] transition-colors hover:bg-[#C6D8FF]"
                    >
                      {isDone && (
                        <span className="absolute inset-0 rounded-full bg-[#2855D9]" />
                      )}
                      {isActive && (
                        <motion.span
                          key={`progress-${activeScene}-${isPaused}-${reducedMotion}`}
                          initial={{ scaleX: isPaused || reducedMotion || isFinalScene ? 1 : 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{
                            duration:
                              isPaused || reducedMotion || isFinalScene
                                ? 0.25
                                : currentScene.durationSeconds,
                            ease: 'linear',
                          }}
                          style={{ transformOrigin: '0% 50%' }}
                          className="absolute inset-0 rounded-full bg-[#FFD43B]"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Action Row */}
              <div className="flex flex-wrap items-center gap-3">
                {activeScene > 0 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="inline-flex items-center gap-2 rounded-full border border-[#2855D9] bg-white px-5 py-3 text-sm font-bold text-[#2855D9] shadow-sm transition-all hover:border-[#183B9B] hover:bg-[#F5F8FF] hover:text-[#183B9B]"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-4 w-4"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M15 6l-6 6 6 6" />
                    </svg>
                    <span>Back</span>
                  </button>
                )}

                {!isFinalScene ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-2.5 rounded-full bg-[#2855D9] px-7 py-3.5 text-base font-bold text-white shadow-[0_14px_30px_-10px_rgba(40,85,217,0.45)] transition-all hover:-translate-y-0.5 hover:bg-[#183B9B]"
                  >
                    <span>Next Scene</span>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-4 w-4"
                      stroke="currentColor"
                      strokeWidth="2.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleGetStarted}
                      className="inline-flex items-center gap-2.5 rounded-full bg-[#2855D9] px-8 py-3.5 text-base font-bold text-white shadow-[0_14px_30px_-10px_rgba(40,85,217,0.48)] transition-all hover:-translate-y-0.5 hover:bg-[#183B9B]"
                    >
                      <span>Get Started</span>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-4 w-4"
                        stroke="currentColor"
                        strokeWidth="2.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14" />
                        <path d="M13 6l6 6-6 6" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={handleSkipIntro}
                      className="inline-flex items-center rounded-full border border-[#2855D9] bg-white px-6 py-3.5 text-sm font-bold text-[#2855D9] shadow-sm transition-colors hover:border-[#183B9B] hover:bg-[#F5F8FF] hover:text-[#183B9B]"
                    >
                      Already have an account? Sign in
                    </button>
                  </>
                )}
              </div>

              <p className="text-xs font-medium text-[#64718A]">
                <span className="hidden sm:inline">
                  Tip: Move your cursor over the 3D scene or use arrow keys to explore.
                </span>
                <span className="sm:hidden">Swipe left or right to switch scenes.</span>
              </p>
            </div>
          </div>

          {/* 3D Clay Illustration Stage Column */}
          <div className="order-1 lg:order-2 lg:col-span-7">
            <div className="relative rounded-[34px] border border-[#E5EAF5] bg-white p-2 shadow-[0_28px_65px_-28px_rgba(40,85,217,0.2)] sm:p-3">
              <div className="relative h-[340px] w-full overflow-hidden rounded-[26px] bg-[#F5F8FF] sm:h-[410px] lg:h-[520px]">
                {/* Full-Bleed Per-Scene College Life Backdrop Photograph */}
                <AnimatePresence mode="sync">
                  <motion.div
                    key={currentStageBackdrop.photo}
                    initial={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
                    transition={{ duration: reducedMotion ? 0.1 : 0.65, ease: 'easeOut' }}
                    className="pointer-events-none absolute inset-0"
                  >
                    <Image
                      src={currentStageBackdrop.photo}
                      alt=""
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 58vw"
                      className="object-cover object-center"
                    />
                    <div
                      className={`absolute inset-0 ${currentStageBackdrop.scrimClass} transition-colors duration-500`}
                    />
                  </motion.div>
                </AnimatePresence>

                <div className="relative z-10 h-full w-full">
                  {webglSupported ? (
                    <StageErrorBoundary fallback={fallbackStage}>
                      <DynamicIntroSceneStage
                        activeScene={activeScene}
                        reducedMotion={reducedMotion}
                        isCompactViewport={isCompactViewport}
                      />
                    </StageErrorBoundary>
                  ) : (
                    fallbackStage
                  )}
                </div>
              </div>

              {/* Subtle Interactive Scene Caption Pill */}
              <div className="pointer-events-none absolute bottom-5 left-5 right-5 z-20 flex items-center justify-between gap-2 sm:bottom-6 sm:left-6 sm:right-6">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#E5EAF5] bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-[#17213A] shadow-sm backdrop-blur-sm">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: currentScene.accentColor }}
                  />
                  {currentScene.badgeText}
                </span>
                <span className="rounded-full border border-[#E5EAF5] bg-white/95 px-3 py-1.5 text-xs font-bold text-[#2855D9] shadow-sm backdrop-blur-sm">
                  {activeScene + 1} / {totalScenes}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
