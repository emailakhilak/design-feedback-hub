'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Layers, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const supabaseReady = isSupabaseConfigured();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!displayName || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
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
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      if (data.session) {
        // Immediate session granted
        router.push('/dashboard');
        router.refresh();
      } else {
        // Email confirmation enabled on Supabase
        setSuccessMessage(
          'Account created successfully! Please check your email to confirm your account or sign in.'
        );
        setIsLoading(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred during signup.';
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
            Create your account to start managing portfolio feedback and generating Gemini AI critiques.
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

        {/* Signup Card */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-7 shadow-xs">
          <h2 className="text-base font-semibold text-stone-900 mb-1">
            Create your designer account
          </h2>
          <p className="text-xs text-stone-500 mb-6">
            Get started with your portfolio workspace in seconds.
          </p>

          {error && (
            <div className="mb-5">
              <Alert variant="error">{error}</Alert>
            </div>
          )}

          {successMessage && (
            <div className="mb-5">
              <Alert variant="success">{successMessage}</Alert>
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
              label="Password (min 6 characters)"
              type="password"
              required
              autoComplete="new-password"
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
              <span>Create Account</span>
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

        {/* Security badge */}
        <div className="flex items-center justify-center gap-6 text-[11px] text-stone-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
            PostgreSQL Row-Level Security
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
