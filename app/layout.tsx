import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import { CommunityProvider } from '@/context/CommunityContext';
import { MessagingProvider } from '@/context/MessagingContext';
import DemoBanner from '@/components/DemoBanner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
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
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#fcfdfc] text-zinc-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
        <AuthProvider>
          <AppProvider>
            <CommunityProvider>
              <MessagingProvider>
                <DemoBanner />
                <Suspense fallback={<div className="h-16 border-b border-zinc-200 bg-white" />}>
                  <Navbar />
                </Suspense>
                <main className="flex-1 flex flex-col">{children}</main>
                <Footer />
              </MessagingProvider>
            </CommunityProvider>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
