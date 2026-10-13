'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Layers, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const supabaseReady = isSupabaseConfigured();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    if (!supabaseReady) {
      setError(
        'Supabase is not configured yet. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setIsLoading(false);
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred during login.';
      setError(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-stone-200/90 rounded-2xl p-7 shadow-xs">
      <h2 className="text-base font-semibold text-stone-900 mb-1">
        Sign in to your account
      </h2>
      <p className="text-xs text-stone-500 mb-6">
        Enter your credentials to access your feedback boards.
      </p>

      {error && (
        <div className="mb-5">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          required
          autoComplete="email"
          placeholder="you@portfolio.design"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="Password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button
          type="submit"
          className="w-full mt-2"
          isLoading={isLoading}
          disabled={isLoading}
        >
          <span>Sign In</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-stone-100 text-center">
        <p className="text-xs text-stone-500">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const supabaseReady = isSupabaseConfigured();

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-xl bg-stone-900 items-center justify-center text-white shadow-sm mb-2">
            <Layers className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Design Feedback Hub
          </h1>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Centralized portfolio project feedback, Gemini AI design critique, and progress tracking for creators.
          </p>
        </div>

        {/* Configuration banner if needed */}
        {!supabaseReady && (
          <Alert variant="warning" title="Supabase Setup Required">
            To enable real authentication and persistence, copy{' '}
            <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px]">.env.example</code> to{' '}
            <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px]">.env.local</code> and provide your Supabase URL & Anon Key.
          </Alert>
        )}

        <Suspense
          fallback={
            <div className="bg-white border border-stone-200 rounded-2xl p-7 text-center text-xs text-stone-400 animate-pulse">
              Loading login form...
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        {/* Security & Workshop note */}
        <div className="flex items-center justify-center gap-6 text-[11px] text-stone-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
            Supabase RLS Protected
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Powered by Gemini 3.8
          </span>
        </div>
      </div>
    </div>
  );
}
