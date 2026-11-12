'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { useMessaging } from '@/context/MessagingContext';
import {
  Repeat,
  Menu,
  X,
  Coins,
  LayoutDashboard,
  User as UserIcon,
  LogOut,
  PlusCircle,
  MessageSquare,
  Calendar,
  Settings,
  ArrowUpRight,
  ChevronDown,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { sessions, swapInvitations } = useApp();
  const { totalUnreadCount } = useMessaging();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pendingSessionRequests = user
    ? sessions.filter((s) => s.teacherId === user.id && s.status === 'pending').length
    : 0;
  const pendingSwapInvites = user
    ? swapInvitations.filter((inv) => inv.recipientId === user.id && inv.status === 'pending').length
    : 0;
  const pendingTotal = pendingSessionRequests + pendingSwapInvites;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setProfileOpen(false);
    setMobileMenuOpen(false);
    await logout();
    router.push('/');
  };

  const navLinks = user
    ? [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Explore Skills', href: '/skills' },
        { label: 'Community', href: '/community' },
        { label: 'Teach a Skill', href: '/teach' },
        { label: 'Wallet', href: '/credits' },
      ]
    : [
        { label: 'How it Works', href: '/#how-it-works' },
        { label: 'Explore Skills', href: '/skills' },
        { label: 'Community', href: '/community' },
        { label: 'Credits', href: '/credits' },
      ];

  const isActive = (href: string) => {
    if (href === '/#how-it-works') return false;
    return pathname === href || (href !== '/' && pathname?.startsWith(href + '/'));
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#171715]/95 backdrop-blur-md border-b border-[#37332E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[72px] gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#FF9B45] text-[#171715] flex items-center justify-center shadow-sm group-hover:bg-[#F5B66B] transition-colors">
              <Repeat className="w-5 h-5 stroke-[2.4]" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-[#F7F5F0]">
              Swap<span className="text-[#FF9B45]">Study</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-full text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-[#2B2824] text-[#F7F5F0] border border-[#37332E]'
                      : 'text-[#AAA69F] hover:text-[#F7F5F0] hover:bg-[#22211F]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Auth / User Actions */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {user ? (
              <>
                <Link
                  href="/credits"
                  className="inline-flex items-center gap-2 bg-[#22211F] hover:bg-[#2B2824] border border-[#37332E] px-3.5 py-1.5 rounded-full transition-colors"
                  title="Open Credit Wallet"
                >
                  <Coins className="w-4 h-4 text-[#FF9B45]" />
                  <span className="text-sm font-bold text-[#F7F5F0] tabular-nums">{user.credits}</span>
                  <span className="text-xs font-medium text-[#AAA69F]">Credits</span>
                </Link>

                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] px-4 py-2 rounded-full text-sm font-bold transition-colors"
                >
                  Workspace
                  <ArrowUpRight className="w-4 h-4" />
                </Link>

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-[#22211F] hover:bg-[#2B2824] border border-[#37332E] transition-colors"
                    aria-label="Open profile menu"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover border border-[#37332E] bg-[#171715]"
                    />
                    <ChevronDown className="w-3.5 h-3.5 text-[#AAA69F]" />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-[#22211F] rounded-2xl border border-[#37332E] shadow-2xl py-2 z-50">
                      <div className="px-4 py-2.5 border-b border-[#37332E]">
                        <p className="text-sm font-bold text-[#F7F5F0] truncate">{user.name}</p>
                        <p className="text-xs text-[#AAA69F] truncate">{user.university}</p>
                      </div>

                      <div className="py-1.5 space-y-0.5 px-1.5">
                        <Link
                          href="/dashboard"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center justify-between px-3 py-2 text-sm font-medium text-[#F7F5F0] hover:bg-[#2B2824] rounded-xl transition-colors"
                        >
                          <span className="flex items-center gap-2.5">
                            <LayoutDashboard className="w-4 h-4 text-[#FF9B45]" />
                            Dashboard
                          </span>
                          {pendingTotal > 0 && (
                            <span className="bg-[#FF9B45] text-[#171715] text-xs font-bold px-2 py-0.5 rounded-full">
                              {pendingTotal}
                            </span>
                          )}
                        </Link>
                        <Link
                          href="/messages"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center justify-between px-3 py-2 text-sm font-medium text-[#F7F5F0] hover:bg-[#2B2824] rounded-xl transition-colors"
                        >
                          <span className="flex items-center gap-2.5">
                            <MessageSquare className="w-4 h-4 text-[#AAA69F]" />
                            Messages
                          </span>
                          {totalUnreadCount > 0 && (
                            <span className="bg-[#FF9B45] text-[#171715] text-xs font-bold px-2 py-0.5 rounded-full">
                              {totalUnreadCount}
                            </span>
                          )}
                        </Link>
                        <Link
                          href="/sessions"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-[#F7F5F0] hover:bg-[#2B2824] rounded-xl transition-colors"
                        >
                          <Calendar className="w-4 h-4 text-[#AAA69F]" />
                          My Sessions
                        </Link>
                        <Link
                          href="/profile"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-[#F7F5F0] hover:bg-[#2B2824] rounded-xl transition-colors"
                        >
                          <UserIcon className="w-4 h-4 text-[#AAA69F]" />
                          Profile
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-[#F7F5F0] hover:bg-[#2B2824] rounded-xl transition-colors"
                        >
                          <Settings className="w-4 h-4 text-[#AAA69F]" />
                          Settings
                        </Link>
                      </div>

                      <div className="border-t border-[#37332E] mt-1.5 pt-1.5 px-1.5">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-[#F07878] hover:bg-[#2B2824] rounded-xl transition-colors text-left"
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
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-[#AAA69F] hover:text-[#F7F5F0] px-4 py-2 rounded-full transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 bg-[#FF9B45] hover:bg-[#F5B66B] text-[#171715] px-5 py-2.5 rounded-full text-sm font-bold transition-colors"
                >
                  Get Started
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            {user && (
              <Link
                href="/credits"
                className="flex items-center gap-1.5 bg-[#22211F] border border-[#37332E] px-3 py-1.5 rounded-full text-xs font-bold text-[#F7F5F0]"
              >
                <Coins className="w-3.5 h-3.5 text-[#FF9B45]" />
                {user.credits}
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#F7F5F0] bg-[#22211F] border border-[#37332E] hover:bg-[#2B2824] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#111110] border-t border-[#37332E] px-4 py-5 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-base font-semibold text-[#F7F5F0] hover:bg-[#22211F] transition-colors"
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <div className="pt-3 mt-3 border-t border-[#37332E] space-y-1.5">
              <Link
                href="/sessions"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold text-[#AAA69F] hover:text-[#F7F5F0] hover:bg-[#22211F]"
              >
                <span>My Sessions</span>
                {pendingTotal > 0 && (
                  <span className="bg-[#FF9B45] text-[#171715] text-xs font-bold px-2 py-0.5 rounded-full">
                    {pendingTotal}
                  </span>
                )}
              </Link>
              <Link
                href="/messages"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold text-[#AAA69F] hover:text-[#F7F5F0] hover:bg-[#22211F]"
              >
                <span>Messages</span>
                {totalUnreadCount > 0 && (
                  <span className="bg-[#FF9B45] text-[#171715] text-xs font-bold px-2 py-0.5 rounded-full">
                    {totalUnreadCount}
                  </span>
                )}
              </Link>
              <Link
                href="/teach"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-[#FF9B45] hover:bg-[#22211F]"
              >
                <PlusCircle className="w-4 h-4" />
                Offer to Teach
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-[#F07878] hover:bg-[#22211F]"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="pt-4 mt-3 border-t border-[#37332E] flex flex-col gap-2.5">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-full border border-[#37332E] text-sm font-semibold text-[#F7F5F0] bg-[#22211F]"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-full bg-[#FF9B45] text-sm font-bold text-[#171715]"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
