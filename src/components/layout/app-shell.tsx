'use client';

import React, { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';

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
  userEmail,
  displayName,
  children,
}: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
