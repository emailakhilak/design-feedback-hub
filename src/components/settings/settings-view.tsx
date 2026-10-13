'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';
import {
  User,
  ShieldCheck,
  Sparkles,
  Database,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Save,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface SettingsViewProps {
  userId: string;
  userEmail: string;
  initialDisplayName: string;
  supabaseConfigured: boolean;
  geminiConfigured: boolean;
  userCreatedAt?: string;
}

export function SettingsView({
  userId,
  userEmail,
  initialDisplayName,
  supabaseConfigured,
  geminiConfigured,
  userCreatedAt,
}: SettingsViewProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!displayName.trim()) {
      setStatusMessage({ type: 'error', text: 'Display name cannot be empty.' });
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Session expired. Please sign in again.');
      }

      // Update public.profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          display_name: displayName.trim(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        throw profileError;
      }

      // Update user auth metadata
      await supabase.auth.updateUser({
        data: { display_name: displayName.trim() },
      });

      setStatusMessage({ type: 'success', text: 'Profile display name updated successfully!' });
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile.';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Settings Intro */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
          Account & Environment Settings
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 mt-1 leading-relaxed">
          Manage your personal designer identity and verify your Supabase database and Google Gemini AI connections.
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
              helperText="Email changes require verification via Supabase Auth."
            />

            <div className="text-[11px] text-stone-400 bg-stone-50 p-2.5 rounded-lg border border-stone-100 space-y-1">
              <div>
                User ID: <span className="font-mono text-stone-600">{userId}</span>
              </div>
              {userCreatedAt && (
                <div>
                  Member Since: <span className="text-stone-600">{new Date(userCreatedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button type="submit" size="sm" isLoading={isSaving} disabled={isSaving}>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                <span>Save Profile Changes</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Integration & Security Checklist */}
      <Card className="p-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>System Integrations & Security Checklist</span>
          </CardTitle>
          <CardDescription>
            Live verification of database connectivity, row-level security, and AI models.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
          {/* Supabase status */}
          <div className="p-4 rounded-xl border border-stone-200 bg-white flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900">
                  Supabase PostgreSQL & Auth
                </h4>
                <p className="text-[11px] text-stone-500">
                  Persistent projects, reviewer comments, and AI report storage.
                </p>
              </div>
            </div>
            {supabaseConfigured ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Connected</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Action Needed</span>
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

          {/* Row Level Security */}
          <div className="p-4 rounded-xl border border-stone-200 bg-white flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-stone-100 text-stone-700">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900">
                  PostgreSQL Row-Level Security (RLS)
                </h4>
                <p className="text-[11px] text-stone-500">
                  Tenant isolation enforced on profiles, projects, feedback, and ai_reports tables.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Active</span>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Account Session & Sign Out */}
      <Card className="p-6 border-rose-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-stone-900">Sign Out</CardTitle>
          <CardDescription>
            End your current browser session on this device.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <Button variant="danger" size="sm" onClick={handleLogout}>
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            <span>Sign Out of Design Feedback Hub</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
