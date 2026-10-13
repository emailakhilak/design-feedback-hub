import { redirect } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { isGeminiConfigured } from '@/lib/ai/gemini';
import { AppShell } from '@/components/layout/app-shell';
import { AiAssistantView } from '@/components/ai/ai-assistant-view';
import { Project, AiReportRecord } from '@/types';


interface PageProps {
  searchParams: Promise<{ project?: string }>;
}

export default async function AiAssistantPage({ searchParams }: PageProps) {
  const { project: initialProjectId } = await searchParams;
  const supabaseReady = isSupabaseConfigured();
  const geminiReady = isGeminiConfigured();

  if (!supabaseReady) {
    return (
      <AppShell
        title="AI Design Assistant"
        description="Gemini-powered portfolio critique, recurring issue detection, and actionable task generation."
        userEmail="designer@workspace.local"
        displayName="Portfolio Creator"
      >
        <AiAssistantView
          projects={[]}
          initialProjectId={initialProjectId}
          recentReports={[]}
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
    redirect('/login?redirectTo=/ai-assistant');
  }

  // Fetch projects
  const { data: projectsData } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch recent AI reports
  const { data: reportsData } = await supabase
    .from('ai_reports')
    .select('*, project:projects(id, title)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const projects = (projectsData || []) as Project[];
  const reports = (reportsData || []) as AiReportRecord[];

  return (
    <AppShell
      title="AI Design Assistant"
      description="Gemini-powered portfolio critique, recurring issue detection, and actionable task generation."
      userEmail={user.email}
      displayName={user.email?.split('@')[0]}
    >
      <AiAssistantView
        projects={projects}
        initialProjectId={initialProjectId}
        recentReports={reports}
        geminiConfigured={geminiReady}
      />
    </AppShell>
  );
}
