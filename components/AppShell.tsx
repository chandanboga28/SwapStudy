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
        <Suspense fallback={<div className="h-16 sm:h-[72px] border-b border-[#37332E] bg-[#171715]" />}>
          <Navbar />
        </Suspense>
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </>
    );
  }

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: 0,
    },
    {
      label: 'Explore Skills',
      href: '/skills',
      icon: Compass,
      badge: 0,
    },
    {
      label: 'My Sessions',
      href: '/sessions',
      icon: Calendar,
      badge: totalPendingAlerts,
    },
    {
      label: 'Messages',
      href: '/messages',
      icon: MessageSquare,
      badge: totalUnreadCount,
    },
    {
      label: 'Community',
      href: '/community',
      icon: Users,
      badge: 0,
    },
    {
      label: 'Wallet',
      href: '/credits',
      icon: Wallet,
      badge: 0,
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: UserIcon,
      badge: 0,
    },
    {
      label: 'Settings',
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
    <div className="flex flex-col h-full justify-between px-4 py-5 bg-[#111110]">
      <div className="space-y-7">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2">
          <Link
            href={user ? '/dashboard' : '/'}
            onClick={onNavigate}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#FF9B45] text-[#171715] flex items-center justify-center shadow-sm group-hover:bg-[#F5B66B] transition-colors">
              <Repeat className="w-5 h-5 stroke-[2.4]" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-[#FF9B45]">
              Swap<span className="text-[#F7F5F0]">Study</span>
            </span>
          </Link>
          {onNavigate && (
            <button
              onClick={onNavigate}
              className="lg:hidden p-1.5 rounded-lg text-[#AAA69F] hover:text-[#F7F5F0] hover:bg-[#22211F]"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5" aria-label="Workspace navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isNavItemActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-full text-[15px] font-semibold transition-all ${
                  active
                    ? 'bg-[#2B2824] text-[#F7F5F0] border border-[#37332E]'
                    : 'text-[#AAA69F] hover:text-[#F7F5F0] hover:bg-[#1B1A18] border border-transparent'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-[18px] h-[18px] shrink-0 ${
                      active ? 'text-[#FF9B45]' : 'text-[#AAA69F]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.badge > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#FF9B45] text-[#171715] text-xs font-extrabold tabular-nums">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Promo CTA Card + User Quick Row */}
      <div className="space-y-4 pt-6">
        <div className="bg-[#F5B66B] text-[#171715] rounded-2xl p-4.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#171715]/10 flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5 text-[#171715]" />
          </div>
          <p className="text-[15px] font-extrabold leading-snug text-[#171715]">
            Share a Skill & Earn Credits
          </p>
          <p className="text-xs font-medium text-[#171715]/80 mt-1 mb-4 leading-relaxed">
            Publish a peer session and build credits for lessons you want next.
          </p>
          <Link
            href="/teach"
            onClick={onNavigate}
            className="w-full inline-flex items-center justify-between px-4 py-2.5 rounded-full bg-[#171715] hover:bg-[#22211F] text-[#F7F5F0] text-xs font-bold transition-colors"
          >
            <span>Offer to Teach</span>
            <ArrowUpRight className="w-4 h-4 text-[#FF9B45]" />
          </Link>
        </div>

        {user && (
          <div className="flex items-center gap-3 px-2 pt-2 border-t border-[#37332E]">
            <Link
              href="/profile"
              onClick={onNavigate}
              className="flex items-center gap-2.5 min-w-0 flex-1 group"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover border border-[#37332E] bg-[#22211F] shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#F7F5F0] truncate group-hover:text-[#FF9B45] transition-colors">
                  {user.name}
                </p>
                <p className="text-xs text-[#AAA69F] truncate">
                  {user.credits} Credits · {user.repRating.toFixed(1)} rating
                </p>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#171715] text-[#F7F5F0]">
      {/* Fixed Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[256px] lg:fixed lg:inset-y-0 lg:left-0 border-r border-[#37332E] bg-[#111110] z-30">
        {sidebarContent()}
      </aside>

      {/* Mobile Slide-over Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <aside className="relative w-[280px] max-w-[85vw] h-full border-r border-[#37332E] bg-[#111110] z-10 overflow-y-auto">
            {sidebarContent(() => setMobileDrawerOpen(false))}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 lg:pl-[256px] ${
          isMessagesRoute ? 'lg:h-screen lg:overflow-hidden' : ''
        }`}
      >
        {/* Top Utility Header */}
        <header className="sticky top-0 z-20 h-16 shrink-0 bg-[#171715]/95 backdrop-blur-md border-b border-[#37332E] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-[#22211F] border border-[#37332E] text-[#F7F5F0] hover:bg-[#2B2824] transition-colors shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <form
              onSubmit={handleGlobalSearch}
              className="relative flex-1 max-w-md hidden sm:block"
            >
              <Search className="w-4 h-4 text-[#AAA69F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search skills, subjects, or peers..."
                className="w-full bg-[#22211F] border border-[#37332E] focus:border-[#FF9B45] rounded-full pl-10 pr-4 py-2 text-sm text-[#F7F5F0] placeholder-[#AAA69F] focus:outline-none transition-colors"
              />
            </form>

            <Link
              href={user ? '/dashboard' : '/'}
              className="sm:hidden flex items-center gap-2 font-extrabold text-lg text-[#F7F5F0] truncate"
            >
              <span className="w-7 h-7 rounded-lg bg-[#FF9B45] text-[#171715] flex items-center justify-center shrink-0">
                <Repeat className="w-4 h-4 stroke-[2.4]" />
              </span>
              <span>SwapStudy</span>
            </Link>
          </div>

          {/* Topbar Status & Profile Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            {user ? (
              <>
                <Link
                  href="/credits"
                  className="inline-flex items-center gap-2 bg-[#22211F] hover:bg-[#2B2824] border border-[#37332E] rounded-full px-3.5 py-1.5 text-sm font-bold text-[#F7F5F0] transition-colors"
                  title="Credit Wallet"
                >
                  <Coins className="w-4 h-4 text-[#FF9B45]" />
                  <span className="tabular-nums">{user.credits}</span>
                  <span className="hidden md:inline text-xs font-medium text-[#AAA69F]">Credits</span>
                </Link>

                <Link
                  href="/sessions"
                  className="relative inline-flex items-center gap-2 bg-[#22211F] hover:bg-[#2B2824] border border-[#37332E] rounded-full px-3.5 py-1.5 text-sm font-semibold text-[#F7F5F0] transition-colors"
                  title="Sessions & Swap Alerts"
                >
                  <Bell className="w-4 h-4 text-[#F5B66B]" />
                  <span className="hidden md:inline text-xs text-[#AAA69F]">
                    {totalPendingAlerts > 0 ? `${totalPendingAlerts} Pending` : 'Sessions'}
                  </span>
                  {totalPendingAlerts > 0 && (
                    <span className="w-2 h-2 rounded-full bg-[#FF9B45]" />
                  )}
                </Link>

                <Link
                  href="/teach"
                  className="hidden xl:inline-flex items-center gap-1.5 bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] rounded-full px-4 py-1.5 text-sm font-bold transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  Offer Skill
                </Link>

                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1 rounded-full border border-[#37332E] bg-[#22211F] hover:border-[#FF9B45]/60 transition-colors"
                    aria-label="Open account menu"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover bg-[#171715]"
                    />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-[#22211F] border border-[#37332E] rounded-2xl shadow-2xl py-2 z-50">
                      <div className="px-4 py-2.5 border-b border-[#37332E]">
                        <p className="text-sm font-bold text-[#F7F5F0] truncate">{user.name}</p>
                        <p className="text-xs text-[#AAA69F] truncate">{user.email}</p>
                      </div>
                      <div className="p-1.5 space-y-0.5">
                        <Link
                          href="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-[#F7F5F0] hover:bg-[#2B2824]"
                        >
                          <UserIcon className="w-4 h-4 text-[#AAA69F]" />
                          Student Profile
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-[#F7F5F0] hover:bg-[#2B2824]"
                        >
                          <Settings className="w-4 h-4 text-[#AAA69F]" />
                          Settings
                        </Link>
                        <Link
                          href="/credits"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-[#F7F5F0] hover:bg-[#2B2824]"
                        >
                          <Wallet className="w-4 h-4 text-[#FF9B45]" />
                          Credit Wallet
                        </Link>
                      </div>
                      <div className="border-t border-[#37332E] mt-1 pt-1 px-1.5">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-[#F07878] hover:bg-[#2B2824] text-left"
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
                  className="text-sm font-semibold text-[#AAA69F] hover:text-[#F7F5F0] px-3.5 py-1.5 rounded-full transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="text-sm font-bold bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] px-4 py-1.5 rounded-full transition-colors"
                >
                  Get Started
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

