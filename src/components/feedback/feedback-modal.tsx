'use client';

import React, { useState } from 'react';
import {
  FeedbackItem,
  FeedbackCategory,
  FeedbackPriority,
  FeedbackStatus,
  Project,
} from '@/types';
import { feedbackInputSchema } from '@/lib/validation';
import { Dialog } from '@/components/ui/dialog';
import { Input, Textarea } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';

export interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  feedbackToEdit?: FeedbackItem | null;
  defaultProjectId?: string;
  defaultStatus?: FeedbackStatus;
  onSuccess: (savedItem: FeedbackItem) => void;
}

export function FeedbackModal({
  isOpen,
  onClose,
  projects,
  feedbackToEdit,
  defaultProjectId,
  defaultStatus = 'To Do',
  onSuccess,
}: FeedbackModalProps) {
  if (!isOpen) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={feedbackToEdit ? 'Edit Feedback Item' : 'Add Reviewer Feedback'}
      description="Record critiques from design reviews, usability tests, or mentors."
      maxWidth="md"
    >
      <FeedbackModalForm
        key={feedbackToEdit?.id ?? `new-feedback-${defaultProjectId ?? 'default'}`}
        projects={projects}
        feedbackToEdit={feedbackToEdit}
        defaultProjectId={defaultProjectId}
        defaultStatus={defaultStatus}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </Dialog>
  );
}

function FeedbackModalForm({
  projects,
  feedbackToEdit,
  defaultProjectId,
  defaultStatus = 'To Do',
  onClose,
  onSuccess,
}: {
  projects: Project[];
  feedbackToEdit?: FeedbackItem | null;
  defaultProjectId?: string;
  defaultStatus?: FeedbackStatus;
  onClose: () => void;
  onSuccess: (savedItem: FeedbackItem) => void;
}) {
  const [projectId, setProjectId] = useState(
    feedbackToEdit?.project_id || defaultProjectId || (projects[0]?.id ?? '')
  );
  const [title, setTitle] = useState(feedbackToEdit?.title || '');
  const [comment, setComment] = useState(feedbackToEdit?.comment || '');
  const [reviewerName, setReviewerName] = useState(
    feedbackToEdit?.reviewer_name || ''
  );
  const [category, setCategory] = useState<FeedbackCategory>(
    feedbackToEdit?.category || 'Visual Design'
  );
  const [priority, setPriority] = useState<FeedbackPriority>(
    feedbackToEdit?.priority || 'Medium'
  );
  const [status, setStatus] = useState<FeedbackStatus>(
    feedbackToEdit?.status || defaultStatus
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories: { label: string; value: FeedbackCategory }[] = [
    { label: 'Visual Design', value: 'Visual Design' },
    { label: 'Usability', value: 'Usability' },
    { label: 'Accessibility', value: 'Accessibility' },
    { label: 'Typography', value: 'Typography' },
    { label: 'Color and Contrast', value: 'Color and Contrast' },
    { label: 'Navigation', value: 'Navigation' },
    { label: 'Responsiveness', value: 'Responsiveness' },
    { label: 'Performance', value: 'Performance' },
    { label: 'Other', value: 'Other' },
  ];

  const priorities: { label: string; value: FeedbackPriority }[] = [
    { label: 'Low', value: 'Low' },
    { label: 'Medium', value: 'Medium' },
    { label: 'High', value: 'High' },
    { label: 'Critical', value: 'Critical' },
  ];

  const statuses: { label: string; value: FeedbackStatus }[] = [
    { label: 'To Do', value: 'To Do' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Completed', value: 'Completed' },
  ];

  const projectOptions = projects.map((p) => ({
    label: p.title,
    value: p.id,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    if (projects.length === 0) {
      setServerError('You must create at least one portfolio project before logging feedback.');
      return;
    }

    const validationResult = feedbackInputSchema.safeParse({
      project_id: projectId,
      title,
      comment,
      reviewer_name: reviewerName.trim() ? reviewerName.trim() : null,
      category,
      priority,
      status,
    });

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((err) => {
        const field = err.path[0] as string;
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setServerError('Session expired. Please sign in.');
        setIsSubmitting(false);
        return;
      }

      const matchingProj = projects.find((p) => p.id === projectId);

      if (feedbackToEdit) {
        const { data, error } = await supabase
          .from('feedback')
          .update({
            project_id: validationResult.data.project_id,
            title: validationResult.data.title,
            comment: validationResult.data.comment,
            reviewer_name: validationResult.data.reviewer_name,
            category: validationResult.data.category,
            priority: validationResult.data.priority,
            status: validationResult.data.status,
          })
          .eq('id', feedbackToEdit.id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
          setServerError(error.message);
          setIsSubmitting(false);
          return;
        }

        const savedWithProject = {
          ...(data as FeedbackItem),
          project: matchingProj ? { id: matchingProj.id, title: matchingProj.title } : null,
        };
        onSuccess(savedWithProject);
      } else {
        const { data, error } = await supabase
          .from('feedback')
          .insert({
            user_id: user.id,
            project_id: validationResult.data.project_id,
            title: validationResult.data.title,
            comment: validationResult.data.comment,
            reviewer_name: validationResult.data.reviewer_name,
            category: validationResult.data.category,
            priority: validationResult.data.priority,
            status: validationResult.data.status,
          })
          .select()
          .single();

        if (error) {
          setServerError(error.message);
          setIsSubmitting(false);
          return;
        }

        const savedWithProject = {
          ...(data as FeedbackItem),
          project: matchingProj ? { id: matchingProj.id, title: matchingProj.title } : null,
        };
        onSuccess(savedWithProject);
      }

      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save feedback.';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {serverError && (
        <div className="mb-4">
          <Alert variant="error">{serverError}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {projectOptions.length > 0 ? (
          <Select
            label="Portfolio Project"
            required
            options={projectOptions}
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            error={errors.project_id}
          />
        ) : (
          <Alert variant="warning">
            Please create a project in My Portfolio before adding feedback.
          </Alert>
        )}

        <Input
          label="Feedback Headline"
          required
          placeholder="e.g., CTA button contrast fails accessibility audit"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
        />

        <Textarea
          label="Detailed Review Comment"
          required
          rows={3}
          placeholder="Reviewer's specific comments, observations, or suggested modifications..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          error={errors.comment}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Reviewer Name or Source (Optional)"
            placeholder="e.g., Senior Designer, Mentor, Usability Test #2"
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            error={errors.reviewer_name}
          />

          <Select
            label="Category"
            required
            options={categories}
            value={category}
            onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
            error={errors.category}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Priority"
            required
            options={priorities}
            value={priority}
            onChange={(e) => setPriority(e.target.value as FeedbackPriority)}
            error={errors.priority}
          />

          <Select
            label="Board Column / Status"
            required
            options={statuses}
            value={status}
            onChange={(e) => setStatus(e.target.value as FeedbackStatus)}
            error={errors.status}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            isLoading={isSubmitting}
            disabled={isSubmitting || projects.length === 0}
          >
            {feedbackToEdit ? 'Save Changes' : 'Log Feedback'}
          </Button>
        </div>
      </form>
    </>
  );
}
