'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signUpDemo } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Layers, ArrowRight, Sparkles, HardDrive, Info } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!displayName || !email) {
      setError('Please fill in your name and email address.');
      return;
    }

    setIsLoading(true);
    try {
      // Local demo account creation in browser Local Storage
      signUpDemo(email, displayName);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred during demo setup.';
      setError(msg);
      setIsLoading(false);
    }
  };

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
            Create your demo designer profile to start managing portfolio feedback and generating Gemini AI critiques.
          </p>
        </div>

        {/* Signup Card */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-7 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-stone-900">
              Create demo designer profile
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60 px-2 py-0.5 rounded-full">
              Demo Mode
            </span>
          </div>
          <p className="text-xs text-stone-500 mb-5">
            Get started with your portfolio workspace in seconds.
          </p>

          <div className="mb-5 p-3 rounded-lg bg-stone-50 border border-stone-200/70 text-[11px] text-stone-600 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-stone-700">Client-Side Demo Profile</p>
              <p className="text-stone-500 mt-0.5">
                Profiles and projects are saved directly into your browser&apos;s Local Storage. No cloud database registration required.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-5">
              <Alert variant="error">{error}</Alert>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <Input
              label="Your Name or Studio Name"
              type="text"
              required
              placeholder="Elena Vance"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />

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
              label="Demo Password (optional)"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              helperText="Demo mode only: passwords are never stored or transmitted."
            />

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={isLoading}
              disabled={isLoading}
            >
              <span>Create Demo Account</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-stone-100 text-center">
            <p className="text-xs text-stone-500">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Persistence & AI status note */}
        <div className="flex items-center justify-center gap-6 text-[11px] text-stone-400">
          <span className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-stone-400" />
            Browser Local Storage
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Official Google Gen AI SDK
          </span>
        </div>
      </div>
    </div>
  );
}
