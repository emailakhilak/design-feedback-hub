'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInDemo, DEFAULT_DEMO_USER } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Layers, ArrowRight, Sparkles, HardDrive, Info } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  const [email, setEmail] = useState(DEFAULT_DEMO_USER.email);
  const [password, setPassword] = useState('demo-password');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Please provide an email address.');
      return;
    }

    setIsLoading(true);
    try {
      // Local Demo authentication: sets session in browser Local Storage
      // Passwords are not stored or transmitted.
      signInDemo(email, email.split('@')[0]);
      router.push(redirectTo);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred during demo sign in.';
      setError(msg);
      setIsLoading(false);
    }
  };

  const handleQuickDemoAccess = () => {
    setIsLoading(true);
    signInDemo(DEFAULT_DEMO_USER.email, DEFAULT_DEMO_USER.display_name);
    router.push(redirectTo);
  };

  return (
    <div className="bg-white border border-stone-200/90 rounded-2xl p-7 shadow-xs">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-semibold text-stone-900">
          Sign in to your account
        </h2>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60 px-2 py-0.5 rounded-full">
          Demo Mode
        </span>
      </div>
      <p className="text-xs text-stone-500 mb-5">
        Enter your credentials or click 1-Click Demo to explore the workspace.
      </p>

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="mb-5 p-3 rounded-lg bg-stone-50 border border-stone-200/70 text-[11px] text-stone-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-stone-700">Client-Side Demo Authentication</p>
          <p className="text-stone-500 mt-0.5">
            This application uses browser Local Storage for persistence. Passwords are not saved or sent across the network.
          </p>
        </div>
      </div>

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
          label="Demo Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          helperText="Any password accepted in demo mode (not stored)."
        />

        <Button
          type="submit"
          className="w-full mt-2"
          isLoading={isLoading}
          disabled={isLoading}
        >
          <span>Sign In (Demo Mode)</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </form>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-stone-200" />
        </div>
        <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
          <span className="bg-white px-2 text-stone-400">or explore instantly</span>
        </div>
      </div>

      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={handleQuickDemoAccess}
        disabled={isLoading}
      >
        <Sparkles className="w-4 h-4 mr-1.5 text-indigo-500" />
        <span>Continue as Alex Rivera (1-Click Demo)</span>
      </Button>

      <div className="mt-6 pt-5 border-t border-stone-100 text-center">
        <p className="text-xs text-stone-500">
          New designer?{' '}
          <Link
            href="/signup"
            className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            Create demo profile
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
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

        <Suspense
          fallback={
            <div className="bg-white border border-stone-200 rounded-2xl p-7 text-center text-xs text-stone-400 animate-pulse">
              Loading demo form...
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        {/* Persistence & AI status note */}
        <div className="flex items-center justify-center gap-6 text-[11px] text-stone-400">
          <span className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-stone-400" />
            Browser Local Storage
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
