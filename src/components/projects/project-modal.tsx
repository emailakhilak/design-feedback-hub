'use client';

import React, { useState } from 'react';
import { Project, ProjectCategory, ProjectStatus } from '@/types';
import { projectInputSchema } from '@/lib/validation';
import { Dialog } from '@/components/ui/dialog';
import { Input, Textarea } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';

export interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectToEdit?: Project | null;
  onSuccess: (savedProject: Project) => void;
}

export function ProjectModal({
  isOpen,
  onClose,
  projectToEdit,
  onSuccess,
}: ProjectModalProps) {
  if (!isOpen) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={projectToEdit ? 'Edit Portfolio Project' : 'Create Portfolio Project'}
      description="Define project metadata, categories, and external links for reviewer feedback."
      maxWidth="lg"
    >
      <ProjectModalForm
        key={projectToEdit?.id ?? 'new-project'}
        projectToEdit={projectToEdit}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </Dialog>
  );
}

function ProjectModalForm({
  projectToEdit,
  onClose,
  onSuccess,
}: {
  projectToEdit?: Project | null;
  onClose: () => void;
  onSuccess: (savedProject: Project) => void;
}) {
  const [title, setTitle] = useState(projectToEdit?.title || '');
  const [description, setDescription] = useState(projectToEdit?.description || '');
  const [detailedDescription, setDetailedDescription] = useState(
    projectToEdit?.detailed_description || ''
  );
  const [category, setCategory] = useState<ProjectCategory>(
    projectToEdit?.category || 'UI/UX Design'
  );
  const [status, setStatus] = useState<ProjectStatus>(
    projectToEdit?.status || 'In Review'
  );
  const [previewImageUrl, setPreviewImageUrl] = useState(
    projectToEdit?.preview_image_url || ''
  );
  const [projectUrl, setProjectUrl] = useState(projectToEdit?.project_url || '');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories: { label: string; value: ProjectCategory }[] = [
    { label: 'UI/UX Design', value: 'UI/UX Design' },
    { label: 'Web Design', value: 'Web Design' },
    { label: 'Mobile App', value: 'Mobile App' },
    { label: 'Branding', value: 'Branding' },
    { label: 'Graphic Design', value: 'Graphic Design' },
    { label: 'Other', value: 'Other' },
  ];

  const statuses: { label: string; value: ProjectStatus }[] = [
    { label: 'Draft', value: 'Draft' },
    { label: 'In Review', value: 'In Review' },
    { label: 'Improving', value: 'Improving' },
    { label: 'Completed', value: 'Completed' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    const validationResult = projectInputSchema.safeParse({
      title,
      description,
      detailed_description: detailedDescription || null,
      category,
      status,
      preview_image_url: previewImageUrl.trim() ? previewImageUrl.trim() : null,
      project_url: projectUrl.trim() ? projectUrl.trim() : null,
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
        setServerError('Authentication session expired. Please sign in again.');
        setIsSubmitting(false);
        return;
      }

      if (projectToEdit) {
        const { data, error } = await supabase
          .from('projects')
          .update({
            title: validationResult.data.title,
            description: validationResult.data.description,
            detailed_description: validationResult.data.detailed_description,
            category: validationResult.data.category,
            status: validationResult.data.status,
            preview_image_url: validationResult.data.preview_image_url,
            project_url: validationResult.data.project_url,
          })
          .eq('id', projectToEdit.id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
          setServerError(error.message);
          setIsSubmitting(false);
          return;
        }

        onSuccess(data as Project);
      } else {
        const { data, error } = await supabase
          .from('projects')
          .insert({
            user_id: user.id,
            title: validationResult.data.title,
            description: validationResult.data.description,
            detailed_description: validationResult.data.detailed_description,
            category: validationResult.data.category,
            status: validationResult.data.status,
            preview_image_url: validationResult.data.preview_image_url,
            project_url: validationResult.data.project_url,
          })
          .select()
          .single();

        if (error) {
          setServerError(error.message);
          setIsSubmitting(false);
          return;
        }

        onSuccess(data as Project);
      }

      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save project.';
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
        <Input
          label="Project Title"
          required
          placeholder="e.g., Lumina Financial Mobile App"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Category"
            required
            options={categories}
            value={category}
            onChange={(e) => setCategory(e.target.value as ProjectCategory)}
            error={errors.category}
          />

          <Select
            label="Current Status"
            required
            options={statuses}
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            error={errors.status}
          />
        </div>

        <Textarea
          label="Short Overview / Elevator Pitch"
          required
          rows={2}
          placeholder="Brief 1-2 sentence overview of the design project purpose..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={errors.description}
        />

        <Textarea
          label="Detailed Context & Objectives (Optional)"
          rows={3}
          placeholder="Specific design challenges, target audiences, or known constraints to guide Gemini AI analysis..."
          value={detailedDescription}
          onChange={(e) => setDetailedDescription(e.target.value)}
          error={errors.detailed_description}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="External URL (Figma, Website, GitHub)"
            type="url"
            placeholder="https://figma.com/file/..."
            value={projectUrl}
            onChange={(e) => setProjectUrl(e.target.value)}
            error={errors.project_url}
          />

          <Input
            label="Cover Image URL (Optional)"
            type="url"
            placeholder="https://images.unsplash.com/..."
            value={previewImageUrl}
            onChange={(e) => setPreviewImageUrl(e.target.value)}
            error={errors.preview_image_url}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting} disabled={isSubmitting}>
            {projectToEdit ? 'Save Changes' : 'Create Project'}
          </Button>
        </div>
      </form>
    </>
  );
}
