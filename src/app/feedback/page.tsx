import { redirect } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/app-shell';
import { FeedbackBoard } from '@/components/feedback/feedback-board';
import { Project, FeedbackItem } from '@/types';


interface PageProps {
  searchParams: Promise<{ project?: string }>;
}

export default async function FeedbackPage({ searchParams }: PageProps) {
  const { project: initialProjectId } = await searchParams;
  const supabaseReady = isSupabaseConfigured();

  if (!supabaseReady) {
    return (
      <AppShell
        title="Feedback Board"
        description="Organize design reviews, prioritize action items, and track iteration velocity."
        userEmail="designer@workspace.local"
        displayName="Portfolio Creator"
      >
        <FeedbackBoard
          initialFeedback={[]}
          projects={[]}
          selectedProjectId={initialProjectId}
        />
      </AppShell>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/feedback');
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
    .select('*, project:projects(id, title)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const projects = (projectsData || []) as Project[];
  const feedbackList = (feedbackData || []) as FeedbackItem[];

  return (
    <AppShell
      title="Feedback Board"
      description="Organize design reviews, prioritize action items, and track iteration velocity."
      userEmail={user.email}
      displayName={user.email?.split('@')[0]}
    >
      <FeedbackBoard
        initialFeedback={feedbackList}
        projects={projects}
        selectedProjectId={initialProjectId}
      />
    </AppShell>
  );
}
