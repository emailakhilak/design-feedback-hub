'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderGit2,
  KanbanSquare,
  Sparkles,
  BarChart3,
  Settings,
  LogOut,
  Layers,
  X,
} from 'lucide-react';
import { signOutDemo } from '@/lib/storage';
import { useRouter } from 'next/navigation';

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  userEmail?: string | null;
  displayName?: string | null;
}

export function Sidebar({ isOpen, onClose, userEmail, displayName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Portfolio', href: '/projects', icon: FolderGit2 },
    { label: 'Feedback Board', href: '/feedback', icon: KanbanSquare },
    { label: 'AI Assistant', href: '/ai-assistant', icon: Sparkles, badge: 'Gemini' },
    { label: 'Reports', href: '/reports', icon: BarChart3 },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    try {
      signOutDemo();
      router.push('/login');
    } catch (e) {
      console.error('Logout error:', e);
      router.push('/login');
    }
  };

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-stone-200/80 w-64 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-stone-100">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center text-white shadow-xs group-hover:bg-stone-800 transition-colors">
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-stone-900 leading-tight">
              Design Feedback Hub
            </span>
            <span className="text-[10px] text-stone-400 font-medium tracking-wide uppercase">
              Portfolio Suite
            </span>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden text-stone-400 hover:text-stone-700 p-1 rounded-md"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-stone-400 uppercase">
          Menu
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all',
                isActive
                  ? 'bg-stone-100 text-stone-900 font-semibold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'w-4 h-4',
                    isActive ? 'text-indigo-600' : 'text-stone-400 group-hover:text-stone-600'
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] bg-indigo-50 text-indigo-600 font-semibold px-1.5 py-0.5 rounded border border-indigo-100">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section & Logout */}
      <div className="p-3 border-t border-stone-100 bg-stone-50/50">
        <div className="flex items-center justify-between px-2 py-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-xs font-semibold text-stone-700 shrink-0">
              {(displayName || userEmail || 'D')[0].toUpperCase()}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs font-medium text-stone-900 truncate">
                {displayName || 'Designer'}
              </span>
              <span className="text-[10px] text-stone-400 truncate">
                {userEmail || 'designer@workspace.com'}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="text-stone-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block h-screen sticky top-0 shrink-0 z-30">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="relative z-10 animate-slide-right h-full">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
