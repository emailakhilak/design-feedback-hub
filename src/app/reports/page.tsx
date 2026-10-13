import { redirect } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/app-shell';
import { ReportsView } from '@/components/reports/reports-view';
import { Project, FeedbackItem, AiReportRecord } from '@/types';


export default async function ReportsPage() {
  const supabaseReady = isSupabaseConfigured();

  if (!supabaseReady) {
    return (
      <AppShell
        title="Reports & Analytics"
        description="Comprehensive review metrics, completion velocity, and spreadsheet exports."
        userEmail="designer@workspace.local"
        displayName="Portfolio Creator"
      >
        <ReportsView projects={[]} feedbackList={[]} recentReports={[]} />
      </AppShell>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/reports');
  }

  // Fetch projects
  const { data: projectsData } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch feedback
  const { data: feedbackData } = await supabase
    .from('feedback')
    .select('*, project:projects(id, title, category)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch AI reports
  const { data: reportsData } = await supabase
    .from('ai_reports')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const projects = (projectsData || []) as Project[];
  const feedbackList = (feedbackData || []) as FeedbackItem[];
  const reports = (reportsData || []) as AiReportRecord[];

  return (
    <AppShell
      title="Reports & Analytics"
      description="Comprehensive review metrics, completion velocity, and spreadsheet exports."
      userEmail={user.email}
      displayName={user.email?.split('@')[0]}
    >
      <ReportsView
        projects={projects}
        feedbackList={feedbackList}
        recentReports={reports}
      />
    </AppShell>
  );
}
