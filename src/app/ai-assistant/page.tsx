import { isGeminiConfigured } from '@/lib/ai/gemini';
import { AppShell } from '@/components/layout/app-shell';
import { AiAssistantView } from '@/components/ai/ai-assistant-view';

interface PageProps {
  searchParams: Promise<{ project?: string }>;
}

export default async function AiAssistantPage({ searchParams }: PageProps) {
  const { project: initialProjectId } = await searchParams;
  const geminiReady = isGeminiConfigured();

  return (
    <AppShell
      title="AI Design Assistant"
      description="Gemini-powered portfolio critique, recurring issue detection, and actionable task generation."
    >
      <AiAssistantView
        initialProjectId={initialProjectId}
        geminiConfigured={geminiReady}
      />
    </AppShell>
  );
}
