'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import {
  getProfile,
  updateProfile,
  getDemoSession,
  signOutDemo,
  resetStorageToDemo,
  isLocalStorageAvailable,
  DEFAULT_DEMO_USER,
} from '@/lib/storage';
import {
  User,
  ShieldCheck,
  Sparkles,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Save,
  RotateCcw,
  Info,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface SettingsViewProps {
  userId?: string;
  userEmail?: string;
  initialDisplayName?: string;
  geminiConfigured?: boolean;
}

export function SettingsView({
  userId: propUserId,
  userEmail: propUserEmail,
  initialDisplayName,
  geminiConfigured = true,
}: SettingsViewProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(() => {
    if (initialDisplayName) return initialDisplayName;
    if (typeof window !== 'undefined') return getProfile().display_name || 'Alex Rivera';
    return 'Alex Rivera';
  });
  const [userEmail, setUserEmail] = useState(() => {
    if (propUserEmail) return propUserEmail;
    if (typeof window !== 'undefined') {
      const session = getDemoSession();
      if (session) return session.user.email;
    }
    return DEFAULT_DEMO_USER.email;
  });
  const [userId, setUserId] = useState(() => {
    if (propUserId) return propUserId;
    if (typeof window !== 'undefined') {
      const session = getDemoSession();
      if (session) return session.user.id;
    }
    return DEFAULT_DEMO_USER.id;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [localStorageReady, setLocalStorageReady] = useState(() => {
    if (typeof window !== 'undefined') return isLocalStorageAvailable();
    return true;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setLocalStorageReady(isLocalStorageAvailable());
      const profile = getProfile();
      const session = getDemoSession();
      if (profile.display_name) setDisplayName(profile.display_name);
      if (session) {
        setUserEmail(session.user.email);
        setUserId(session.user.id);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('dfh_storage_change', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dfh_storage_change', handleStorageChange);
    };
  }, []);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!displayName.trim()) {
      setStatusMessage({ type: 'error', text: 'Display name cannot be empty.' });
      return;
    }

    setIsSaving(true);
    try {
      updateProfile({
        display_name: displayName.trim(),
      });

      setStatusMessage({ type: 'success', text: 'Profile display name updated successfully in Local Storage!' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile in storage.';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset all portfolio projects, feedback items, and reports to default demo data?')) {
      resetStorageToDemo();
      const profile = getProfile();
      setDisplayName(profile.display_name);
      setStatusMessage({ type: 'success', text: 'Storage successfully reset to default demo dataset.' });
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const handleLogout = () => {
    try {
      signOutDemo();
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Settings Intro */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
          Account & Storage Settings
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 mt-1 leading-relaxed">
          Manage your personal designer identity, check browser storage status, and verify your Google Gemini AI connection.
        </p>
      </div>

      {statusMessage && (
        <Alert variant={statusMessage.type === 'success' ? 'success' : 'error'}>
          {statusMessage.text}
        </Alert>
      )}

      {/* Profile Settings Card */}
      <Card className="p-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-stone-700" />
            <span>Designer Profile</span>
          </CardTitle>
          <CardDescription>
            This name appears on your reviewer feedback logs and welcome greeting.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
            <Input
              label="Display Name / Studio Handle"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alex Rivera"
            />

            <Input
              label="Email Address"
              disabled
              value={userEmail}
              helperText="Demo user email stored in browser session."
            />

            <div className="text-[11px] text-stone-400 bg-stone-50 p-2.5 rounded-lg border border-stone-100 space-y-1">
              <div>
                User ID: <span className="font-mono text-stone-600">{userId}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button type="submit" size="sm" isLoading={isSaving} disabled={isSaving}>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                <span>Save Profile Changes</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Integration & Storage Checklist */}
      <Card className="p-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Storage & Service Checklist</span>
          </CardTitle>
          <CardDescription>
            Live verification of browser persistence and server-side Google Gemini AI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
          {/* Local Storage status */}
          <div className="p-4 rounded-xl border border-stone-200 bg-white flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900">
                  Browser Local Storage
                </h4>
                <p className="text-[11px] text-stone-500">
                  Projects, Kanban feedback items, and AI reports persist across page refreshes.
                </p>
              </div>
            </div>
            {localStorageReady ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Active & Persisting</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Storage Disabled</span>
              </span>
            )}
          </div>

          {/* Gemini AI status */}
          <div className="p-4 rounded-xl border border-stone-200 bg-white flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900">
                  Google Gemini 3.8 Flash AI Engine
                </h4>
                <p className="text-[11px] text-stone-500">
                  Official @google/genai SDK calling model gemini-3.8-flash server-side.
                </p>
              </div>
            </div>
            {geminiConfigured ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Configured</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Key Missing</span>
              </span>
            )}
          </div>

          {/* Data Management Note */}
          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-2.5 text-xs text-stone-600">
              <Info className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-stone-800">Reset Demo Data</p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Restore default sample projects, feedback items, and initial workspace metrics.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleResetData}>
              <RotateCcw className="w-3.5 h-3.5 mr-1 text-stone-500" />
              <span>Reset to Demo Data</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Session & Sign Out */}
      <Card className="p-6 border-rose-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-stone-900">Sign Out</CardTitle>
          <CardDescription>
            End your current demo session in this browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <Button variant="danger" size="sm" onClick={handleLogout}>
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            <span>Sign Out of Demo Workspace</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
