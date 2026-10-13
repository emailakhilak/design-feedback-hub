import { AppShell } from '@/components/layout/app-shell';
import { ProjectsView } from '@/components/projects/projects-view';

export default async function ProjectsPage() {
  return (
    <AppShell
      title="My Portfolio"
      description="Manage your portfolio case studies, categories, and reviewer feedback loops."
    >
      <ProjectsView />
    </AppShell>
  );
}
