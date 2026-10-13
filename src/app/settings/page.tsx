import { isGeminiConfigured } from '@/lib/ai/gemini';
import { AppShell } from '@/components/layout/app-shell';
import { SettingsView } from '@/components/settings/settings-view';

export default async function SettingsPage() {
  const geminiReady = isGeminiConfigured();

  return (
    <AppShell
      title="Settings"
      description="Manage your account profile and inspect system integrations."
    >
      <SettingsView geminiConfigured={geminiReady} />
    </AppShell>
  );
}
