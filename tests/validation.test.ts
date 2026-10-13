import { describe, it, expect } from 'vitest';
import {
  projectInputSchema,
  feedbackInputSchema,
  aiAnalysisOutputSchema,
  projectCategorySchema,
  feedbackPrioritySchema,
  feedbackStatusSchema,
} from '@/lib/validation';

describe('Project Input Validation', () => {
  it('accepts valid project payload', () => {
    const valid = {
      title: 'E-commerce Design System',
      description: 'A modular design system for high-growth commerce brands.',
      category: 'UI/UX Design',
      status: 'In Review',
      preview_image_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8',
      project_url: 'https://figma.com/@portfolio',
    };
    const result = projectInputSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects short title or empty description', () => {
    const invalidTitle = {
      title: 'A',
      description: 'Valid description here',
      category: 'Web Design',
    };
    expect(projectInputSchema.safeParse(invalidTitle).success).toBe(false);

    const invalidDesc = {
      title: 'Valid Title',
      description: 'Too',
      category: 'Web Design',
    };
    expect(projectInputSchema.safeParse(invalidDesc).success).toBe(false);
  });

  it('rejects invalid category', () => {
    expect(projectCategorySchema.safeParse('Invalid Category').success).toBe(false);
    expect(projectCategorySchema.safeParse('UI/UX Design').success).toBe(true);
  });

  it('rejects malformed URL', () => {
    const malformed = {
      title: 'Design Project',
      description: 'A comprehensive portfolio piece.',
      category: 'Branding',
      preview_image_url: 'not-a-valid-url',
    };
    expect(projectInputSchema.safeParse(malformed).success).toBe(false);
  });
});

describe('Feedback Input Validation', () => {
  it('accepts valid feedback payload', () => {
    const valid = {
      project_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Footer link contrast is below 4.5:1',
      comment: 'Reviewers noted that the light gray text on white background fails WCAG AA standards.',
      reviewer_name: 'Alex Design Lead',
      category: 'Accessibility',
      priority: 'High',
      status: 'To Do',
    };
    const result = feedbackInputSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects non-uuid project_id', () => {
    const invalid = {
      project_id: '12345',
      title: 'Valid title',
      comment: 'Valid comment text here',
      category: 'Visual Design',
    };
    expect(feedbackInputSchema.safeParse(invalid).success).toBe(false);
  });

  it('validates priority and status values strictly', () => {
    expect(feedbackPrioritySchema.safeParse('Critical').success).toBe(true);
    expect(feedbackPrioritySchema.safeParse('SuperHigh').success).toBe(false);
    expect(feedbackStatusSchema.safeParse('Completed').success).toBe(true);
    expect(feedbackStatusSchema.safeParse('Archived').success).toBe(false);
  });
});

describe('AI Analysis Output Schema Validation', () => {
  it('validates and safely parses structured Gemini output', () => {
    const mockAiResponse = {
      summary: {
        overall_summary:
          'The portfolio feedback highlights strong typography but emphasizes usability bottlenecks in the checkout funnel.',
        recurring_issues: ['Inconsistent button padding', 'Low contrast muted text'],
        positive_observations: ['Modern color palette', 'Clean typography hierarchy'],
        usability_concerns: ['Checkout steps unclear'],
        accessibility_concerns: ['Color contrast on disabled state buttons'],
        areas_for_investigation: ['Mobile viewport behavior on fold'],
      },
      recommendations: [
        {
          id: 'rec-1',
          title: 'Standardize primary CTA button hierarchy',
          explanation: 'Users struggle to identify the next action due to equal button weights.',
          supporting_feedback: ['Button styling confusing on mobile'],
          suggested_priority: 'High',
          estimated_effort: 'Small',
          concrete_steps: ['Define a primary solid style', 'Apply ghost style to secondary actions'],
          expected_benefit: 'Improves conversion clarity',
          confidence: 'High',
        },
      ],
      actionable_tasks: [
        {
          id: 'task-1',
          title: 'Increase footer link contrast to 4.5:1',
          comment: 'Change slate-400 to slate-600 on light backgrounds to meet WCAG AA.',
          category: 'Accessibility',
          priority: 'High',
          suggested_status: 'To Do',
        },
      ],
      project_review: {
        strengths: ['Clean aesthetic layout'],
        areas_for_improvement: ['Form interaction states'],
        actionable_recommendations: ['Add hover and focus rings on inputs'],
        order_of_work: ['Fix accessibility first', 'Refine button weights'],
        next_steps_plan: 'Implement contrast adjustments, then conduct 5 usability testing sessions.',
      },
    };

    const parsed = aiAnalysisOutputSchema.safeParse(mockAiResponse);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.recommendations.length).toBe(1);
      expect(parsed.data.actionable_tasks[0].priority).toBe('High');
    }
  });

  it('rejects incomplete AI output missing summary', () => {
    const incomplete = {
      recommendations: [],
      actionable_tasks: [],
    };
    expect(aiAnalysisOutputSchema.safeParse(incomplete).success).toBe(false);
  });
});
