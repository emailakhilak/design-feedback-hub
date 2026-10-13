import { AppShell } from '@/components/layout/app-shell';
import { FeedbackBoard } from '@/components/feedback/feedback-board';

interface PageProps {
  searchParams: Promise<{ project?: string }>;
}

export default async function FeedbackPage({ searchParams }: PageProps) {
  const { project: initialProjectId } = await searchParams;

  return (
    <AppShell
      title="Feedback Board"
      description="Organize design reviews, prioritize action items, and track iteration velocity."
    >
      <FeedbackBoard selectedProjectId={initialProjectId} />
    </AppShell>
  );
}
