'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { useMessaging } from '@/context/MessagingContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Repeat,
  LayoutDashboard,
  Compass,
  Calendar,
  MessageSquare,
  Users,
  Wallet,
  User as UserIcon,
  Settings,
  Search,
  Coins,
  Bell,
  Menu,
  X,
  ArrowUpRight,
  LogOut,
  PlusCircle,
  BookOpen,
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

const PUBLIC_MARKETING_ROUTES = new Set(['/', '/login', '/signup']);

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const { user, logout } = useAuth();
  const { sessions, swapInvitations } = useApp();
  const { totalUnreadCount } = useMessaging();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isMarketingRoute = PUBLIC_MARKETING_ROUTES.has(pathname);
  const isIntroRoot = pathname === '/';
  const isMessagesRoute = pathname === '/messages' || pathname.startsWith('/messages/');

  const pendingSessionRequests = user
    ? sessions.filter((s) => s.teacherId === user.id && s.status === 'pending').length
    : 0;
  const pendingSwapInvites = user
    ? swapInvitations.filter((inv) => inv.recipientId === user.id && inv.status === 'pending').length
    : 0;
  const totalPendingAlerts = pendingSessionRequests + pendingSwapInvites;

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  if (isIntroRoot) {
    return <main className="flex-1 flex flex-col">{children}</main>;
  }

  if (isMarketingRoute) {
    return (
      <>
        <Suspense fallback={<div className="h-16 sm:h-[72px] border-b-[1.5px] border-[#4A4E57] bg-[#F8F6F0]" />}>
          <Navbar />
        </Suspense>
        <main className="flex-1 flex flex-col synth-dot-canvas bg-[#EFECE4]">{children}</main>
        <Footer />
      </>
    );
  }

  const navItems = [
    {
      label: 'Dashboard',
      code: '01',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: 0,
    },
    {
      label: 'Explore Skills',
      code: '02',
      href: '/skills',
      icon: Compass,
      badge: 0,
    },
    {
      label: 'My Sessions',
      code: '03',
      href: '/sessions',
      icon: Calendar,
      badge: totalPendingAlerts,
    },
    {
      label: 'Messages',
      code: '04',
      href: '/messages',
      icon: MessageSquare,
      badge: totalUnreadCount,
    },
    {
      label: 'Community',
      code: '05',
      href: '/community',
      icon: Users,
      badge: 0,
    },
    {
      label: 'Wallet',
      code: '06',
      href: '/credits',
      icon: Wallet,
      badge: 0,
    },
    {
      label: 'Profile',
      code: '07',
      href: '/profile',
      icon: UserIcon,
      badge: 0,
    },
    {
      label: 'Settings',
      code: '08',
      href: '/settings',
      icon: Settings,
      badge: 0,
    },
  ];

  const isNavItemActive = (href: string) => {
    if (href === '/skills') {
      return pathname === '/skills' || pathname.startsWith('/skills/');
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchValue.trim();
    if (trimmed) {
      router.push(`/skills?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push('/skills');
    }
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    setMobileDrawerOpen(false);
    await logout();
    router.push('/');
  };

  const sidebarContent = (onNavigate?: () => void) => (
    <div className="flex flex-col h-full justify-between px-4 py-5 bg-[#E6E3DA] text-[#1F2227]">
      <div className="space-y-6">
        {/* Hardware-Zine Brand Header */}
        <div className="flex items-center justify-between px-1">
          <Link
            href={user ? '/dashboard' : '/'}
            onClick={onNavigate}
            className="flex flex-col gap-1 group"
          >
            <div className="inline-flex items-center gap-2 bg-[#DCEB8E] border-[1.5px] border-[#4A4E57] rounded-lg px-3 py-1.5 shadow-[2.5px_2.5px_0_#B9B4A8] -rotate-1 group-hover:rotate-0 transition-transform">
              <span className="w-2 h-2 rounded-full bg-[#C25138] border border-[#4A4E57]" />
              <Repeat className="w-4 h-4 stroke-[2.5] text-[#1F2227]" />
              <span className="font-extrabold text-[17px] tracking-tight text-[#1F2227]">
                SwapStudy!
              </span>
            </div>
          </Link>
          {onNavigate && (
            <button
              onClick={onNavigate}
              className="lg:hidden p-1.5 rounded-lg text-[#1F2227] bg-[#F8F6F0] border border-[#4A4E57] hover:bg-[#EFECE4] cursor-pointer"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links as Tactile Hardware Keys */}
        <nav className="space-y-1.5" aria-label="Workspace navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isNavItemActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-[14px] font-bold transition-all border-[1.5px] ${
                  active
                    ? 'bg-[#C25138] border-[#4A4E57] text-[#FFFFFF] shadow-[0_1.5px_0_#7A3222] translate-y-[1px]'
                    : 'bg-[#F8F6F0] hover:bg-[#FCFBF7] border-[#4A4E57]/75 hover:border-[#4A4E57] text-[#1F2227] shadow-[0_2px_0_#B8B3A7]'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      active
                        ? 'bg-[#9E3922] border-[#FFFFFF]/30 text-[#FFFFFF]'
                        : 'bg-[#E6E3DA] border-[#4A4E57]/40 text-[#464B55]'
                    }`}
                  >
                    {item.code}
                  </span>
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      active ? 'text-[#FFFFFF]' : 'text-[#464B55]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.badge > 0 && (
                  <span
                    className={`ml-2 inline-flex items-center justify-center min-w-[22px] h-[20px] px-1.5 rounded-md font-mono text-[11px] font-extrabold tabular-nums border ${
                      active
                        ? 'bg-[#F4DC82] border-[#4A4E57] text-[#1F2227]'
                        : 'bg-[#DCEB8E] border-[#4A4E57] text-[#1F2227]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Butter-Yellow Zine Module + User Quick Row */}
      <div className="space-y-4 pt-6">
        <div className="bg-[#F4DC82] text-[#1F2227] border-[1.5px] border-[#4A4E57] shadow-[3px_3px_0_#B9B4A8] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F8F6F0] border border-[#4A4E57] flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-[#1F2227]" />
            </div>
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#25282E] text-[#CCE27A]">
              +1 CR / HR
            </span>
          </div>
          <p className="text-[14px] font-extrabold leading-snug text-[#1F2227]">
            Share a Skill & Earn Credits
          </p>
          <p className="text-xs font-medium text-[#363940] mt-1 mb-3.5 leading-relaxed">
            Publish a peer slot and build credits for sessions you want next.
          </p>
          <Link
            href="/teach"
            onClick={onNavigate}
            className="w-full inline-flex items-center justify-between px-3.5 py-2 rounded-lg bg-[#25282E] hover:bg-[#191B20] border border-[#4A4E57] shadow-[0_2px_0_#8E7F47] text-[#F2EFE8] text-xs font-mono font-bold transition-colors"
          >
            <span>+ OFFER_TO_TEACH</span>
            <ArrowUpRight className="w-4 h-4 text-[#CCE27A]" />
          </Link>
        </div>

        {user && (
          <div className="flex items-center gap-3 px-2 pt-2.5 border-t border-[#BEB9AC]">
            <Link
              href="/profile"
              onClick={onNavigate}
              className="flex items-center gap-2.5 min-w-0 flex-1 group"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-9 h-9 rounded-lg object-cover border-[1.5px] border-[#4A4E57] bg-[#F8F6F0] shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#1F2227] truncate group-hover:text-[#2F4D96] transition-colors">
                  {user.name}
                </p>
                <p className="text-xs font-mono font-semibold text-[#464B55] truncate">
                  {user.credits} Cr · {user.repRating.toFixed(1)}★
                </p>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#EFECE4] text-[#1F2227]">
      {/* Fixed Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[262px] lg:fixed lg:inset-y-0 lg:left-0 border-r-[1.5px] border-[#4A4E57] bg-[#E6E3DA] z-30">
        {sidebarContent()}
      </aside>

      {/* Mobile Slide-over Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#1F2227]/45 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <aside className="relative w-[280px] max-w-[85vw] h-full border-r-[1.5px] border-[#4A4E57] bg-[#E6E3DA] z-10 overflow-y-auto">
            {sidebarContent(() => setMobileDrawerOpen(false))}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 lg:pl-[262px] synth-dot-canvas bg-[#EFECE4] ${
          isMessagesRoute ? 'lg:h-screen lg:overflow-hidden' : ''
        }`}
      >
        {/* Top Hardware Utility Header */}
        <header className="sticky top-0 z-20 h-16 shrink-0 bg-[#F8F6F0]/95 backdrop-blur-md border-b-[1.5px] border-[#4A4E57] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-[#E6E3DA] border-[1.5px] border-[#4A4E57] text-[#1F2227] hover:bg-[#EFECE4] transition-colors shrink-0 cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <form
              onSubmit={handleGlobalSearch}
              className="relative flex-1 max-w-md hidden sm:block"
            >
              <Search className="w-4 h-4 text-[#464B55] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search skills, subjects, or peers..."
                className="w-full bg-[#FFFFFF] border-[1.5px] border-[#4A4E57] focus:border-[#3B5CA8] rounded-lg pl-10 pr-4 py-1.5 text-sm text-[#1F2227] placeholder-[#5A606B] focus:outline-none transition-colors"
              />
            </form>

            <Link
              href={user ? '/dashboard' : '/'}
              className="sm:hidden flex items-center gap-2 font-extrabold text-base text-[#1F2227] truncate"
            >
              <span className="w-7 h-7 rounded-md bg-[#DCEB8E] border-[1.5px] border-[#4A4E57] text-[#1F2227] flex items-center justify-center shrink-0">
                <Repeat className="w-4 h-4 stroke-[2.4]" />
              </span>
              <span>SwapStudy!</span>
            </Link>
          </div>

          {/* Topbar Status & Profile Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            {user ? (
              <>
                <Link
                  href="/credits"
                  className="inline-flex items-center gap-2 bg-[#25282E] hover:bg-[#2F333B] border-[1.5px] border-[#4A4E57] rounded-lg px-3.5 py-1.5 text-xs font-mono font-bold text-[#CCE27A] transition-colors"
                  title="Credit Wallet"
                >
                  <span className="w-2 h-2 rounded-full bg-[#7AD6A1]" />
                  <Coins className="w-3.5 h-3.5 text-[#CCE27A]" />
                  <span className="tabular-nums">CR_BAL: {user.credits}</span>
                </Link>

                <Link
                  href="/sessions"
                  className="relative inline-flex items-center gap-2 bg-[#E6E3DA] hover:bg-[#EFECE4] border-[1.5px] border-[#4A4E57] shadow-[0_2px_0_#9D998F] rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-[#1F2227] transition-colors"
                  title="Sessions & Swap Alerts"
                >
                  <Bell className="w-3.5 h-3.5 text-[#2F4D96]" />
                  <span className="hidden md:inline">
                    {totalPendingAlerts > 0 ? `${totalPendingAlerts} PENDING` : 'SESSIONS'}
                  </span>
                  {totalPendingAlerts > 0 && (
                    <span className="w-2 h-2 rounded-full bg-[#C25138]" />
                  )}
                </Link>

                <Link
                  href="/teach"
                  className="hidden xl:inline-flex items-center gap-1.5 bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] rounded-lg px-3.5 py-1.5 text-xs font-mono font-bold transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  + DROP_SKILL
                </Link>

                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1 rounded-lg border-[1.5px] border-[#4A4E57] bg-[#E6E3DA] hover:bg-[#EFECE4] transition-colors cursor-pointer"
                    aria-label="Open account menu"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-7 h-7 rounded-md object-cover bg-[#F8F6F0]"
                    />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-[#F8F6F0] border-[1.5px] border-[#4A4E57] rounded-xl shadow-[4px_4px_0_#C5C0B4] py-2 z-50">
                      <div className="px-4 py-2.5 border-b border-[#CEC9BC]">
                        <p className="text-sm font-bold text-[#1F2227] truncate">{user.name}</p>
                        <p className="text-xs text-[#464B55] truncate">{user.email}</p>
                      </div>
                      <div className="p-1.5 space-y-0.5">
                        <Link
                          href="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-[#1F2227] hover:bg-[#E6E3DA]"
                        >
                          <UserIcon className="w-4 h-4 text-[#464B55]" />
                          Student Profile
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-[#1F2227] hover:bg-[#E6E3DA]"
                        >
                          <Settings className="w-4 h-4 text-[#464B55]" />
                          Settings
                        </Link>
                        <Link
                          href="/credits"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-[#1F2227] hover:bg-[#E6E3DA]"
                        >
                          <Wallet className="w-4 h-4 text-[#2F4D96]" />
                          Credit Wallet
                        </Link>
                      </div>
                      <div className="border-t border-[#CEC9BC] mt-1 pt-1 px-1.5">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-[#8F2618] hover:bg-[#FCE7E3] text-left cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          Log out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-xs font-mono font-bold text-[#1F2227] bg-[#E6E3DA] hover:bg-[#EFECE4] border-[1.5px] border-[#4A4E57] shadow-[0_2px_0_#9D998F] px-3.5 py-1.5 rounded-lg transition-colors"
                >
                  LOG IN
                </Link>
                <Link
                  href="/signup"
                  className="text-xs font-mono font-bold bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2px_0_#2A3F75] text-[#FFFFFF] px-4 py-1.5 rounded-lg transition-colors"
                >
                  GET STARTED
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Page Container */}
        <main
          className={`flex-1 flex flex-col min-w-0 ${
            isMessagesRoute ? 'min-h-0 overflow-hidden' : ''
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
