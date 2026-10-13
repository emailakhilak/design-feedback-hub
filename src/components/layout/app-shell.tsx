'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { getDemoSession, getProfile, initializeStorageIfNeeded } from '@/lib/storage';

export interface AppShellProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  userEmail?: string | null;
  displayName?: string | null;
  children: React.ReactNode;
}

export function AppShell({
  title,
  description,
  actions,
  userEmail: initialEmail,
  displayName: initialDisplayName,
  children,
}: AppShellProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    if (initialEmail) return initialEmail;
    if (typeof window !== 'undefined') {
      initializeStorageIfNeeded();
      const session = getDemoSession();
      return session?.user.email || 'designer@workspace.com';
    }
    return null;
  });

  const [displayName, setDisplayName] = useState<string | null>(() => {
    if (initialDisplayName) return initialDisplayName;
    if (typeof window !== 'undefined') {
      initializeStorageIfNeeded();
      const profile = getProfile();
      const session = getDemoSession();
      return profile.display_name || session?.user.display_name || 'Alex Rivera';
    }
    return null;
  });

  useEffect(() => {
    initializeStorageIfNeeded();
    const session = getDemoSession();
    if (!session || !session.isAuthenticated) {
      router.push('/login');
      return;
    }
    const handleStorageChange = () => {
      const updatedSession = getDemoSession();
      if (!updatedSession || !updatedSession.isAuthenticated) {
        router.push('/login');
        return;
      }
      const updatedProfile = getProfile();
      setUserEmail(updatedSession.user.email || 'designer@workspace.com');
      setDisplayName(updatedProfile.display_name || updatedSession.user.display_name || 'Alex Rivera');
    };

    window.addEventListener('dfh_storage_change', handleStorageChange);
    return () => {
      window.removeEventListener('dfh_storage_change', handleStorageChange);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex text-stone-900 antialiased font-sans">
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        userEmail={userEmail}
        displayName={displayName}
      />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          title={title}
          description={description}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          actions={actions}
        />
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
