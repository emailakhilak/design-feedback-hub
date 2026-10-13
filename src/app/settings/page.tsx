import { redirect } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { isGeminiConfigured } from '@/lib/ai/gemini';
import { AppShell } from '@/components/layout/app-shell';
import { SettingsView } from '@/components/settings/settings-view';


export default async function SettingsPage() {
  const supabaseReady = isSupabaseConfigured();
  const geminiReady = isGeminiConfigured();

  if (!supabaseReady) {
    return (
      <AppShell
        title="Settings"
        description="Manage your account profile and inspect system integrations."
        userEmail="designer@workspace.local"
        displayName="Portfolio Creator"
      >
        <SettingsView
          userId="local-designer"
          userEmail="designer@workspace.local"
          initialDisplayName="Portfolio Creator"
          supabaseConfigured={false}
          geminiConfigured={geminiReady}
        />
      </AppShell>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/settings');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const displayName =
    profile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'Designer';

  return (
    <AppShell
      title="Settings"
      description="Manage your account profile and inspect system integrations."
      userEmail={user.email}
      displayName={displayName}
    >
      <SettingsView
        userId={user.id}
        userEmail={user.email || ''}
        initialDisplayName={displayName}
        supabaseConfigured={true}
        geminiConfigured={geminiReady}
        userCreatedAt={user.created_at}
      />
    </AppShell>
  );
}
