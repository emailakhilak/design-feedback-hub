import { isGeminiConfigured } from '@/lib/ai/gemini';
import { AppShell } from '@/components/layout/app-shell';
import { DashboardView } from '@/components/dashboard/dashboard-view';

export default async function DashboardPage() {
  const geminiReady = isGeminiConfigured();

  return (
    <AppShell
      title="Dashboard"
      description="Overview of your portfolio projects, reviewer feedback, and improvement velocity."
    >
      <DashboardView geminiConfigured={geminiReady} />
    </AppShell>
  );
}
