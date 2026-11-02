'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import {
  ArrowRightLeft,
  Calendar,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Plus,
  Coins,
  LayoutDashboard,
  ChevronDown,
  Users,
  MessageSquare,
} from 'lucide-react';
import { useMessaging } from '@/context/MessagingContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { sessions } = useApp();
  const { totalUnreadCount } = useMessaging();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const currentUser = mounted ? user : null;

  // Count pending sessions where current user is teacher
  const pendingRequestsCount = sessions.filter(
    (s) => s.teacherId === currentUser?.id && s.status === 'pending'
  ).length;

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15">
          {/* Logo / Brand */}
          <div className="flex items-center gap-7">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs shadow-emerald-600/30 group-hover:bg-emerald-500 transition-colors">
                <ArrowRightLeft className="w-4 h-4 transition-transform group-hover:rotate-180 duration-500" />
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900 flex items-center">
                Swap<span className="text-emerald-600">Study</span>
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/skills"
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-[13px] font-medium transition-all ${
                  isActive('/skills')
                    ? 'text-emerald-700 bg-emerald-50/80 font-semibold border border-emerald-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                Explore Skills
              </Link>
              <Link
                href="/community"
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-[13px] font-medium transition-all flex items-center gap-1.5 ${
                  isActive('/community')
                    ? 'text-emerald-700 bg-emerald-50/80 font-semibold border border-emerald-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                Community
              </Link>
              <Link
                href="/teach"
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-[13px] font-medium transition-all flex items-center gap-1 ${
                  isActive('/teach')
                    ? 'text-emerald-700 bg-emerald-50/80 font-semibold border border-emerald-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                Offer to Teach
              </Link>
              <Link
                href="/credits"
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-[13px] font-medium transition-all ${
                  isActive('/credits')
                    ? 'text-emerald-700 bg-emerald-50/80 font-semibold border border-emerald-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                How Credits Work
              </Link>
              {currentUser && (
                <>
                  <Link
                    href="/dashboard"
                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-[13px] font-medium transition-all ${
                      isActive('/dashboard')
                        ? 'text-emerald-700 bg-emerald-50/80 font-semibold border border-emerald-200/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/messages"
                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-[13px] font-medium transition-all relative flex items-center gap-1.5 ${
                      isActive('/messages')
                        ? 'text-emerald-700 bg-emerald-50/80 font-semibold border border-emerald-200/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    Messages
                    {totalUnreadCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                        {totalUnreadCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/sessions"
                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-[13px] font-medium transition-all relative flex items-center gap-1.5 ${
                      isActive('/sessions')
                        ? 'text-emerald-700 bg-emerald-50/80 font-semibold border border-emerald-200/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    Sessions
                    {pendingRequestsCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                        {pendingRequestsCount}
                      </span>
                    )}
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Right Action Area */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <>
                {/* Credit Balance Pill */}
                <Link
                  href="/credits"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 hover:bg-emerald-100/80 transition-colors shadow-2xs group"
                  title="Your Available Swap Credits"
                >
                  <Coins className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-emerald-900">{currentUser.credits}</span>
                  <span className="text-[11px] font-medium text-emerald-700">Credits</span>
                </Link>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center gap-2 p-1 pl-1.5 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 focus:outline-hidden"
                  >
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                    />
                    <div className="text-left hidden lg:block pr-1">
                      <p className="text-xs font-semibold text-slate-900 leading-none">{currentUser.name.split(' ')[0]}</p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200/90 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <div className="px-3.5 py-2 border-b border-slate-100">
                        <p className="text-[11px] text-slate-500 font-medium">Signed in as</p>
                        <p className="text-xs font-semibold text-slate-900 truncate">{currentUser.name}</p>
                        <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">{currentUser.credits} platform credits</p>
                      </div>

                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                        Dashboard
                      </Link>

                      <Link
                        href="/sessions"
                        className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          My Sessions
                        </div>
                        {pendingRequestsCount > 0 && (
                          <span className="px-1.5 py-0.2 text-[10px] bg-amber-100 text-amber-800 rounded font-semibold">
                            {pendingRequestsCount} new
                          </span>
                        )}
                      </Link>

                      <Link
                        href="/profile"
                        className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        Profile & Skills
                      </Link>

                      <div className="border-t border-slate-100 my-1"></div>

                      <button
                        onClick={() => logout()}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 text-left"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs shadow-emerald-600/30 transition-all"
                >
                  Start Learning
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            {currentUser && (
              <Link
                href="/credits"
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold"
              >
                <Coins className="w-3 h-3 text-emerald-600" />
                {currentUser.credits} Cr
              </Link>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle Navigation"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2">
          {currentUser && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-3 border border-slate-100">
              <img src={currentUser.avatar} alt={currentUser.name} className="w-9 h-9 rounded-full object-cover" />
              <div>
                <p className="font-semibold text-xs text-slate-900">{currentUser.name}</p>
                <p className="text-[11px] text-slate-500">{currentUser.university}</p>
                <p className="text-[11px] text-emerald-600 font-semibold">{currentUser.credits} credits available</p>
              </div>
            </div>
          )}

          <Link
            href="/skills"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Explore Skills
          </Link>
          <Link
            href="/community"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
          >
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>Campus Community</span>
          </Link>
          <Link
            href="/teach"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            + Offer to Teach a Skill
          </Link>
          <Link
            href="/credits"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            How Credits Work
          </Link>

          {currentUser ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Dashboard
              </Link>
              <Link
                href="/messages"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  Messages
                </span>
                {totalUnreadCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] bg-emerald-600 text-white rounded font-bold">
                    {totalUnreadCount} new
                  </span>
                )}
              </Link>
              <Link
                href="/sessions"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center justify-between"
              >
                <span>My Sessions</span>
                {pendingRequestsCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] bg-amber-500 text-white rounded font-bold">
                    {pendingRequestsCount} new
                  </span>
                )}
              </Link>
              <Link
                href="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Profile & Skills
              </Link>
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="pt-3 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center px-4 py-2 rounded-lg border border-slate-200 text-slate-800 text-xs font-medium hover:bg-slate-50"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 shadow-xs"
              >
                Start Learning
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
