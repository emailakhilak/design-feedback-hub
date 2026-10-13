import { z } from 'zod';

export const projectCategorySchema = z.enum([
  'UI/UX Design',
  'Web Design',
  'Mobile App',
  'Branding',
  'Graphic Design',
  'Other',
]);

export const projectStatusSchema = z.enum([
  'Draft',
  'In Review',
  'Improving',
  'Completed',
]);

export const feedbackCategorySchema = z.enum([
  'Visual Design',
  'Usability',
  'Accessibility',
  'Typography',
  'Color and Contrast',
  'Navigation',
  'Responsiveness',
  'Performance',
  'Other',
]);

export const feedbackPrioritySchema = z.enum(['Low', 'Medium', 'High', 'Critical']);

export const feedbackStatusSchema = z.enum(['To Do', 'In Progress', 'Completed']);

// Optional or empty string URL validator
const optionalUrlSchema = z
  .string()
  .trim()
  .optional()
  .refine(
    (val) => {
      if (!val || val.length === 0) return true;
      try {
        const parsed = new URL(val);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'Must be a valid HTTP or HTTPS URL' }
  );

export const projectInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Title must be at least 2 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  description: z
    .string()
    .trim()
    .min(5, 'Description must be at least 5 characters')
    .max(1000, 'Description cannot exceed 1000 characters'),
  detailed_description: z
    .string()
    .trim()
    .max(5000, 'Detailed description cannot exceed 5000 characters')
    .optional()
    .nullable(),
  category: projectCategorySchema,
  preview_image_url: optionalUrlSchema.nullable(),
  project_url: optionalUrlSchema.nullable(),
  status: projectStatusSchema.default('In Review'),
});

export const feedbackInputSchema = z.object({
  project_id: z.string().uuid('Invalid project ID'),
  title: z
    .string()
    .trim()
    .min(2, 'Title must be at least 2 characters')
    .max(120, 'Title cannot exceed 120 characters'),
  comment: z
    .string()
    .trim()
    .min(5, 'Feedback comment must be at least 5 characters')
    .max(3000, 'Feedback comment cannot exceed 3000 characters'),
  reviewer_name: z
    .string()
    .trim()
    .max(80, 'Reviewer name cannot exceed 80 characters')
    .optional()
    .nullable(),
  category: feedbackCategorySchema,
  priority: feedbackPrioritySchema.default('Medium'),
  status: feedbackStatusSchema.default('To Do'),
});

export const aiAnalyzeRequestSchema = z.object({
  projectId: z.string().optional(),
  project: z.object({
    id: z.string().optional(),
    title: z.string().min(1, 'Project title is required'),
    description: z.string(),
    detailed_description: z.string().optional().nullable(),
    category: z.string(),
    status: z.string(),
  }),
  feedbackItems: z.array(
    z.object({
      id: z.string().optional(),
      title: z.string().min(1, 'Feedback title is required'),
      comment: z.string().min(1, 'Feedback comment is required'),
      reviewer_name: z.string().optional().nullable(),
      category: feedbackCategorySchema.catch('Visual Design'),
      priority: feedbackPrioritySchema.catch('Medium'),
      status: feedbackStatusSchema.catch('To Do'),
    })
  ).min(1, 'At least one feedback item is required for AI synthesis'),
});

// AI Output schema validation
export const aiAnalysisOutputSchema = z.object({
  summary: z.object({
    overall_summary: z.string().min(10),
    recurring_issues: z.array(z.string()).default([]),
    positive_observations: z.array(z.string()).default([]),
    usability_concerns: z.array(z.string()).default([]),
    accessibility_concerns: z.array(z.string()).default([]),
    areas_for_investigation: z.array(z.string()).default([]),
  }),
  recommendations: z.array(
    z.object({
      id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
      title: z.string(),
      explanation: z.string(),
      supporting_feedback: z.array(z.string()).default([]),
      suggested_priority: feedbackPrioritySchema.catch('Medium'),
      estimated_effort: z.enum(['Small', 'Medium', 'Large']).catch('Medium'),
      concrete_steps: z.array(z.string()).default([]),
      expected_benefit: z.string(),
      confidence: z.enum(['High', 'Medium', 'Low']).catch('High'),
    })
  ).default([]),
  actionable_tasks: z.array(
    z.object({
      id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
      title: z.string(),
      comment: z.string(),
      category: feedbackCategorySchema.catch('Visual Design'),
      priority: feedbackPrioritySchema.catch('Medium'),
      suggested_status: feedbackStatusSchema.catch('To Do'),
    })
  ).default([]),
  project_review: z.object({
    strengths: z.array(z.string()).default([]),
    areas_for_improvement: z.array(z.string()).default([]),
    actionable_recommendations: z.array(z.string()).default([]),
    order_of_work: z.array(z.string()).default([]),
    next_steps_plan: z.string().default(''),
  }),
});

export type ProjectInput = z.infer<typeof projectInputSchema>;
export type FeedbackInput = z.infer<typeof feedbackInputSchema>;
export type AiAnalysisOutput = z.infer<typeof aiAnalysisOutputSchema>;
