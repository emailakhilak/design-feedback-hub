'use client';

import React from 'react';
import { Menu, Sparkles, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export interface HeaderProps {
  title: string;
  description?: string;
  onOpenMobileMenu: () => void;
  actions?: React.ReactNode;
}

export function Header({
  title,
  description,
  onOpenMobileMenu,
  actions,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-[#FBFBFA]/85 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-8 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden text-stone-600 hover:text-stone-900 p-1.5 rounded-lg border border-stone-200 bg-white shadow-2xs"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-stone-900">
              {title}
            </h1>
            {description && (
              <p className="text-xs text-stone-500 hidden sm:block mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {actions}
          <Link href="/ai-assistant" className="hidden lg:inline-flex">
            <Button variant="outline" size="sm" className="text-indigo-600 border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>AI Insights</span>
            </Button>
          </Link>
          <Link href="/projects" className="hidden sm:inline-flex">
            <Button size="sm">
              <FolderPlus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
