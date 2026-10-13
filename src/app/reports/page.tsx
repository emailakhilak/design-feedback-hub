import { AppShell } from '@/components/layout/app-shell';
import { ReportsView } from '@/components/reports/reports-view';

export default async function ReportsPage() {
  return (
    <AppShell
      title="Reports & Analytics"
      description="Comprehensive review metrics, completion velocity, and spreadsheet exports."
    >
      <ReportsView />
    </AppShell>
  );
}
