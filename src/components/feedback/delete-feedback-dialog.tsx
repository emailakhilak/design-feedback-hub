'use client';

import React, { useState } from 'react';
import { FeedbackItem } from '@/types';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { deleteFeedbackItem } from '@/lib/storage';

export interface DeleteFeedbackDialogProps {
  isOpen: boolean;
  item: FeedbackItem | null;
  onClose: () => void;
  onDeleted: (itemId: string) => void;
}

export function DeleteFeedbackDialog({
  isOpen,
  item,
  onClose,
  onDeleted,
}: DeleteFeedbackDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!item) return null;

  const handleDelete = () => {
    setIsDeleting(true);
    setError(null);

    try {
      const success = deleteFeedbackItem(item.id);
      if (!success) {
        setError('Feedback item could not be found in local storage.');
        setIsDeleting(false);
        return;
      }

      onDeleted(item.id);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete feedback.';
      setError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Feedback Item?"
      description="Remove this suggestion from your feedback board."
      maxWidth="sm"
    >
      <div className="space-y-4">
        <p className="text-xs text-stone-600 leading-relaxed">
          Are you sure you want to delete <strong className="text-stone-900">&quot;{item.title}&quot;</strong>? This record will be permanently deleted from local storage.
        </p>

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
            Delete
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
