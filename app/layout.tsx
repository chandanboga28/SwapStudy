import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import { CommunityProvider } from '@/context/CommunityContext';
import { MessagingProvider } from '@/context/MessagingContext';
import DemoBanner from '@/components/DemoBanner';
import AppShell from '@/components/AppShell';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SwapStudy — Student-to-Student Skill Exchange',
  description: 'Learn a skill. Teach a skill. Grow together. A credit-based student skill exchange platform where every student can be both a teacher and a learner.',
  keywords: ['peer learning', 'student tutoring', 'skill exchange', 'credits', 'education', 'study swap'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${manrope.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-[#171715] text-[#F7F5F0] font-sans selection:bg-[#FF9B45]/25 selection:text-[#F7F5F0]">
        <AuthProvider>
          <AppProvider>
            <CommunityProvider>
              <MessagingProvider>
                <DemoBanner />
                <Suspense fallback={<div className="min-h-screen bg-[#171715]" />}>
                  <AppShell>{children}</AppShell>
                </Suspense>
              </MessagingProvider>
            </CommunityProvider>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
