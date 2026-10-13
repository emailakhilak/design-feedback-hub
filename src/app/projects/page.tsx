import { redirect } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/app-shell';
import { ProjectsView } from '@/components/projects/projects-view';
import { Project } from '@/types';


export default async function ProjectsPage() {
  const supabaseReady = isSupabaseConfigured();

  if (!supabaseReady) {
    return (
      <AppShell
        title="My Portfolio"
        description="Manage your portfolio case studies, categories, and reviewer feedback loops."
        userEmail="designer@workspace.local"
        displayName="Portfolio Creator"
      >
        <ProjectsView initialProjects={[]} />
      </AppShell>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/projects');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single();

  const { data: projectsData } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const projects = (projectsData || []) as Project[];
  const displayName = profile?.display_name || user.email?.split('@')[0] || 'Designer';

  return (
    <AppShell
      title="My Portfolio"
      description="Manage your portfolio case studies, categories, and reviewer feedback loops."
      userEmail={user.email}
      displayName={displayName}
    >
      <ProjectsView initialProjects={projects} />
    </AppShell>
  );
}
