import { redirect } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { isGeminiConfigured } from '@/lib/ai/gemini';
import { AppShell } from '@/components/layout/app-shell';
import { DashboardView } from '@/components/dashboard/dashboard-view';
import { Project, FeedbackItem } from '@/types';


export default async function DashboardPage() {
  const supabaseReady = isSupabaseConfigured();
  const geminiReady = isGeminiConfigured();

  if (!supabaseReady) {
    // Show dashboard shell with instructions to configure Supabase
    return (
      <AppShell
        title="Dashboard"
        description="Overview of your portfolio projects, reviewer feedback, and improvement velocity."
        userEmail="designer@workspace.local"
        displayName="Portfolio Creator"
      >
        <DashboardView
          initialProjects={[]}
          initialFeedback={[]}
          userEmail="designer@workspace.local"
          displayName="Portfolio Creator"
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
    redirect('/login?redirectTo=/dashboard');
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch user projects
  const { data: projectsData } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch user feedback
  const { data: feedbackData } = await supabase
    .from('feedback')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const projects = (projectsData || []) as Project[];
  const feedbackList = (feedbackData || []) as FeedbackItem[];
  const displayName = profile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'Designer';

  return (
    <AppShell
      title="Dashboard"
      description="Overview of your portfolio projects, reviewer feedback, and improvement velocity."
      userEmail={user.email}
      displayName={displayName}
    >
      <DashboardView
        initialProjects={projects}
        initialFeedback={feedbackList}
        userEmail={user.email || ''}
        displayName={displayName}
        supabaseConfigured={true}
        geminiConfigured={geminiReady}
      />
    </AppShell>
  );
}
