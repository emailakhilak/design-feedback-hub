'use client';

import React, { useState } from 'react';
import { Project } from '@/types';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';
import { AlertTriangle } from 'lucide-react';

export interface DeleteProjectDialogProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  onDeleted: (projectId: string) => void;
}

export function DeleteProjectDialog({
  isOpen,
  project,
  onClose,
  onDeleted,
}: DeleteProjectDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!project) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Session expired. Please log in.');
        setIsDeleting(false);
        return;
      }

      // Delete project (cascade handles associated feedback and ai_reports)
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id)
        .eq('user_id', user.id);

      if (deleteError) {
        setError(deleteError.message);
        setIsDeleting(false);
        return;
      }

      onDeleted(project.id);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete project.';
      setError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Portfolio Project?"
      description="This action cannot be undone."
      maxWidth="sm"
    >
      <div className="space-y-4">
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-900">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            Permanently delete <strong className="font-semibold">&quot;{project.title}&quot;</strong> and all associated reviewer feedback items and AI analysis reports.
          </div>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            isLoading={isDeleting}
            disabled={isDeleting}
          >
            Delete Project
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
