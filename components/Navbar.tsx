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
    <header className="sticky top-0 z-40 w-full bg-[#F8F6F0]/95 backdrop-blur-md border-b-[1.5px] border-[#4A4E57]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[72px] gap-4">
          {/* Brand Logo Stamp */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="inline-flex items-center gap-2 bg-[#DCEB8E] border-[1.5px] border-[#4A4E57] rounded-lg px-2.5 py-1.5 shadow-[2px_2px_0_#B9B4A8] -rotate-1 group-hover:rotate-0 transition-transform">
              <span className="w-2 h-2 rounded-full bg-[#C25138] border border-[#4A4E57]" />
              <Repeat className="w-4 h-4 stroke-[2.5] text-[#1F2227]" />
              <span className="font-extrabold text-base tracking-tight text-[#1F2227]">
                SwapStudy!
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Keycaps */}
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border-[1.5px] ${
                    active
                      ? 'bg-[#C25138] border-[#4A4E57] text-[#FFFFFF] shadow-[0_1px_0_#7F3222] translate-y-[1px]'
                      : 'bg-[#E6E3DA] hover:bg-[#EFECE4] border-[#595E68] text-[#1F2227] shadow-[0_2.5px_0_#9D998F]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Auth / User Actions */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            {user ? (
              <>
                <Link
                  href="/credits"
                  className="inline-flex items-center gap-2 bg-[#25282E] hover:bg-[#2F333B] border-[1.5px] border-[#4A4E57] px-3.5 py-1.5 rounded-lg transition-colors"
                  title="Open Credit Wallet"
                >
                  <Coins className="w-4 h-4 text-[#CCE27A]" />
                  <span className="font-mono text-xs font-bold text-[#CCE27A] tabular-nums">
                    CR_BAL: {user.credits}
                  </span>
                </Link>

                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2.5px_0_#2A3F75] text-[#FFFFFF] px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors"
                >
                  WORKSPACE
                  <ArrowUpRight className="w-4 h-4" />
                </Link>

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-lg bg-[#E6E3DA] hover:bg-[#EFECE4] border-[1.5px] border-[#4A4E57] transition-colors cursor-pointer"
                    aria-label="Open profile menu"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-7 h-7 rounded-md object-cover border border-[#4A4E57] bg-[#F8F6F0]"
                    />
                    <ChevronDown className="w-3.5 h-3.5 text-[#1F2227]" />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-[#F8F6F0] rounded-xl border-[1.5px] border-[#4A4E57] shadow-[4px_4px_0_#C5C0B4] py-2 z-50">
                      <div className="px-4 py-2.5 border-b border-[#CEC9BC]">
                        <p className="text-sm font-bold text-[#1F2227] truncate">{user.name}</p>
                        <p className="text-xs text-[#464B55] truncate">{user.university}</p>
                      </div>

                      <div className="py-1.5 space-y-0.5 px-1.5">
                        <Link
                          href="/dashboard"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center justify-between px-3 py-2 text-sm font-semibold text-[#1F2227] hover:bg-[#E6E3DA] rounded-lg transition-colors"
                        >
                          <span className="flex items-center gap-2.5">
                            <LayoutDashboard className="w-4 h-4 text-[#2F4D96]" />
                            Dashboard
                          </span>
                          {pendingTotal > 0 && (
                            <span className="bg-[#DCEB8E] border border-[#4A4E57] text-[#1F2227] text-xs font-bold px-2 py-0.5 rounded-md">
                              {pendingTotal}
                            </span>
                          )}
                        </Link>
                        <Link
                          href="/messages"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center justify-between px-3 py-2 text-sm font-semibold text-[#1F2227] hover:bg-[#E6E3DA] rounded-lg transition-colors"
                        >
                          <span className="flex items-center gap-2.5">
                            <MessageSquare className="w-4 h-4 text-[#464B55]" />
                            Messages
                          </span>
                          {totalUnreadCount > 0 && (
                            <span className="bg-[#DCEB8E] border border-[#4A4E57] text-[#1F2227] text-xs font-bold px-2 py-0.5 rounded-md">
                              {totalUnreadCount}
                            </span>
                          )}
                        </Link>
                        <Link
                          href="/sessions"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-[#1F2227] hover:bg-[#E6E3DA] rounded-lg transition-colors"
                        >
                          <Calendar className="w-4 h-4 text-[#464B55]" />
                          My Sessions
                        </Link>
                        <Link
                          href="/profile"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-[#1F2227] hover:bg-[#E6E3DA] rounded-lg transition-colors"
                        >
                          <UserIcon className="w-4 h-4 text-[#464B55]" />
                          Profile
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-[#1F2227] hover:bg-[#E6E3DA] rounded-lg transition-colors"
                        >
                          <Settings className="w-4 h-4 text-[#464B55]" />
                          Settings
                        </Link>
                      </div>

                      <div className="border-t border-[#CEC9BC] mt-1.5 pt-1.5 px-1.5">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-[#8F2618] hover:bg-[#FCE7E3] rounded-lg transition-colors text-left cursor-pointer"
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
                  className="text-xs font-mono font-bold text-[#1F2227] bg-[#E6E3DA] hover:bg-[#EFECE4] border-[1.5px] border-[#4A4E57] shadow-[0_2.5px_0_#9D998F] px-4 py-2 rounded-lg transition-colors"
                >
                  LOG IN
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 bg-[#3B5CA8] hover:bg-[#314E91] border-[1.5px] border-[#2A3F75] shadow-[0_2.5px_0_#2A3F75] text-[#FFFFFF] px-4 py-2 rounded-lg text-xs font-mono font-bold transition-colors"
                >
                  GET STARTED
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
                className="flex items-center gap-1.5 bg-[#25282E] border-[1.5px] border-[#4A4E57] px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-[#CCE27A]"
              >
                <Coins className="w-3.5 h-3.5 text-[#CCE27A]" />
                {user.credits}
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#1F2227] bg-[#E6E3DA] border-[1.5px] border-[#4A4E57] hover:bg-[#EFECE4] transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#E6E3DA] border-t-[1.5px] border-[#4A4E57] px-4 py-5 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-lg text-sm font-bold text-[#1F2227] bg-[#F8F6F0] border border-[#4A4E57]/40 hover:bg-[#DCEB8E] transition-colors"
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <div className="pt-3 mt-3 border-t border-[#B5B0A3] space-y-1.5">
              <Link
                href="/sessions"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-semibold text-[#1F2227] hover:bg-[#F8F6F0]"
              >
                <span>My Sessions</span>
                {pendingTotal > 0 && (
                  <span className="bg-[#DCEB8E] border border-[#4A4E57] text-[#1F2227] text-xs font-bold px-2 py-0.5 rounded-md">
                    {pendingTotal}
                  </span>
                )}
              </Link>
              <Link
                href="/messages"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-semibold text-[#1F2227] hover:bg-[#F8F6F0]"
              >
                <span>Messages</span>
                {totalUnreadCount > 0 && (
                  <span className="bg-[#DCEB8E] border border-[#4A4E57] text-[#1F2227] text-xs font-bold px-2 py-0.5 rounded-md">
                    {totalUnreadCount}
                  </span>
                )}
              </Link>
              <Link
                href="/teach"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-[#2F4D96] hover:bg-[#F8F6F0]"
              >
                <PlusCircle className="w-4 h-4" />
                Offer to Teach
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold text-[#8F2618] hover:bg-[#FCE7E3] cursor-pointer"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="pt-4 mt-3 border-t border-[#B5B0A3] flex flex-col gap-2.5">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-lg border-[1.5px] border-[#4A4E57] text-sm font-bold text-[#1F2227] bg-[#F8F6F0]"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-lg border-[1.5px] border-[#2A3F75] bg-[#3B5CA8] text-sm font-bold text-[#FFFFFF]"
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
