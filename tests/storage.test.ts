import { describe, it, expect, beforeEach } from 'vitest';
import {
  STORAGE_KEYS,
  initializeStorageIfNeeded,
  resetStorageToDemo,
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getFeedbackItems,
  getFeedbackById,
  createFeedbackItem,
  updateFeedbackItem,
  updateFeedbackStatus,
  deleteFeedbackItem,
  saveAiReport,
  getAiReports,
  getProfile,
  updateProfile,
  getDemoSession,
  signInDemo,
  signOutDemo,
  getDashboardMetrics,
  generateId,
} from '@/lib/storage';
import { AiAnalysisResult } from '@/types';

// In-memory mock localStorage for Vitest environment
class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}

describe('Local Storage Persistence Layer', () => {
  beforeEach(() => {
    // Setup window.localStorage mock
    const mockStorage = new LocalStorageMock();
    Object.defineProperty(globalThis, 'window', {
      value: {
        localStorage: mockStorage,
      },
      writable: true,
      configurable: true,
    });
  });

  it('generates valid RFC-4122 v4 UUIDs', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    // UUID v4 regex: 8-4-4-4-12 hex characters
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('initializes default seed projects, feedback, and demo profile when empty', () => {
    initializeStorageIfNeeded();

    const projects = getProjects();
    const feedback = getFeedbackItems();
    const profile = getProfile();
    const session = getDemoSession();

    expect(projects.length).toBeGreaterThanOrEqual(3);
    expect(feedback.length).toBeGreaterThanOrEqual(5);
    expect(profile.display_name).toBe('Alex Rivera');
    expect(session?.isAuthenticated).toBe(true);
    expect(session?.user.email).toBe('alex.designer@portfolio.design');
  });

  it('does not overwrite existing projects when initialized multiple times', () => {
    initializeStorageIfNeeded();
    const initialCount = getProjects().length;

    createProject({
      user_id: 'user-test',
      title: 'Custom Brand Identity',
      description: 'Handcrafted branding project',
      category: 'Branding',
      status: 'In Review',
    });

    initializeStorageIfNeeded();
    expect(getProjects().length).toBe(initialCount + 1);
  });

  describe('Projects CRUD and Cascade Operations', () => {
    it('creates, reads, updates, and deletes projects', () => {
      initializeStorageIfNeeded();

      // Create
      const newProj = createProject({
        user_id: 'test-user',
        title: 'Design System Documentation',
        description: 'Comprehensive tokens and component documentation site.',
        category: 'UI/UX Design',
        status: 'In Review',
        project_url: 'https://docs.designsystem.local',
      });

      expect(newProj.id).toBeDefined();
      expect(newProj.title).toBe('Design System Documentation');

      // Read
      const found = getProjectById(newProj.id);
      expect(found).not.toBeNull();
      expect(found?.title).toBe('Design System Documentation');

      // Update
      const updated = updateProject(newProj.id, {
        title: 'Design System Documentation v2',
        status: 'Completed',
      });
      expect(updated?.title).toBe('Design System Documentation v2');
      expect(updated?.status).toBe('Completed');

      // Delete
      const deleted = deleteProject(newProj.id);
      expect(deleted).toBe(true);
      expect(getProjectById(newProj.id)).toBeNull();
    });

    it('cascades deletion: deleting a project deletes all associated feedback and AI reports', () => {
      initializeStorageIfNeeded();

      const proj = createProject({
        user_id: 'test-user',
        title: 'Cascade Test Project',
        description: 'Testing cascade delete of related records.',
        category: 'Mobile App',
        status: 'Draft',
      });

      const fb1 = createFeedbackItem({
        user_id: 'test-user',
        project_id: proj.id,
        title: 'Feedback item 1',
        comment: 'Comment for cascade test 1',
        category: 'Visual Design',
        priority: 'High',
        status: 'To Do',
      });

      const fb2 = createFeedbackItem({
        user_id: 'test-user',
        project_id: proj.id,
        title: 'Feedback item 2',
        comment: 'Comment for cascade test 2',
        category: 'Accessibility',
        priority: 'Medium',
        status: 'In Progress',
      });

      // Verify items exist
      expect(getFeedbackById(fb1.id)).not.toBeNull();
      expect(getFeedbackById(fb2.id)).not.toBeNull();

      // Delete parent project
      deleteProject(proj.id);

      // Verify cascade deletion
      expect(getProjectById(proj.id)).toBeNull();
      expect(getFeedbackById(fb1.id)).toBeNull();
      expect(getFeedbackById(fb2.id)).toBeNull();
      expect(getFeedbackItems(proj.id).length).toBe(0);
    });

    it('computes live feedback counts dynamically', () => {
      initializeStorageIfNeeded();

      const proj = createProject({
        user_id: 'test-user',
        title: 'Count Test Project',
        description: 'Testing live feedback counts computation.',
        category: 'Web Design',
        status: 'Improving',
      });

      createFeedbackItem({
        user_id: 'test-user',
        project_id: proj.id,
        title: 'Todo Item',
        comment: 'Pending item',
        category: 'Typography',
        priority: 'Low',
        status: 'To Do',
      });

      createFeedbackItem({
        user_id: 'test-user',
        project_id: proj.id,
        title: 'Completed Item',
        comment: 'Done item',
        category: 'Typography',
        priority: 'Medium',
        status: 'Completed',
      });

      const projects = getProjects();
      const loaded = projects.find((p) => p.id === proj.id);
      expect(loaded?.feedback_count).toBe(2);
      expect(loaded?.completed_count).toBe(1);
    });
  });

  describe('Feedback Items & Kanban Status Transitions', () => {
    it('creates, updates, and updates Kanban column status', () => {
      initializeStorageIfNeeded();
      const projects = getProjects();
      const projId = projects[0].id;

      const item = createFeedbackItem({
        user_id: 'test-user',
        project_id: projId,
        title: 'Button padding mismatch',
        comment: 'Horizontal padding should be 16px rather than 8px.',
        reviewer_name: 'Lead Designer',
        category: 'Visual Design',
        priority: 'Medium',
        status: 'To Do',
      });

      expect(item.status).toBe('To Do');

      // Transition to In Progress
      const inProgress = updateFeedbackStatus(item.id, 'In Progress');
      expect(inProgress?.status).toBe('In Progress');

      // Transition to Completed
      const completed = updateFeedbackStatus(item.id, 'Completed');
      expect(completed?.status).toBe('Completed');

      // Verify persistence
      const retrieved = getFeedbackById(item.id);
      expect(retrieved?.status).toBe('Completed');

      // Update feedback fields
      const edited = updateFeedbackItem(item.id, { title: 'Updated button padding title' });
      expect(edited?.title).toBe('Updated button padding title');

      // Delete feedback item
      const deleted = deleteFeedbackItem(item.id);
      expect(deleted).toBe(true);
      expect(getFeedbackById(item.id)).toBeNull();
    });
  });

  describe('AI Report Records & Profile Storage', () => {
    it('saves and retrieves AI analysis reports', () => {
      initializeStorageIfNeeded();
      const proj = getProjects()[0];

      const mockResult: AiAnalysisResult = {
        summary: {
          overall_summary: 'Overall strong visual system with minor accessibility flaws.',
          recurring_issues: ['Button contrast'],
          positive_observations: ['Modern layout'],
          usability_concerns: [],
          accessibility_concerns: ['Color contrast'],
          areas_for_investigation: [],
        },
        recommendations: [
          {
            id: 'rec-1',
            title: 'Improve primary button contrast',
            explanation: 'Increases accessibility compliance to WCAG AA.',
            supporting_feedback: ['Button contrast fails'],
            suggested_priority: 'High',
            estimated_effort: 'Small',
            concrete_steps: ['Update token #0E4E49'],
            expected_benefit: 'WCAG AA compliance',
            confidence: 'High',
          },
        ],
        actionable_tasks: [
          {
            id: 'task-1',
            title: 'Bump primary CTA contrast to 4.5:1',
            comment: 'Adjust dark teal tone in design tokens.',
            category: 'Color and Contrast',
            priority: 'High',
            suggested_status: 'To Do',
          },
        ],
        project_review: {
          strengths: ['Hierarchy'],
          areas_for_improvement: ['Contrast'],
          actionable_recommendations: ['Token audit'],
          order_of_work: ['1. Contrast', '2. Typography'],
          next_steps_plan: 'Review tokens before portfolio submission.',
        },
      };

      const saved = saveAiReport({
        project_id: proj.id,
        user_id: 'test-user',
        report_type: 'feedback_analysis',
        structured_result: mockResult,
      });

      expect(saved.id).toBeDefined();

      const reports = getAiReports(proj.id);
      expect(reports.length).toBeGreaterThanOrEqual(1);
      expect(reports[0].structured_result.summary.overall_summary).toContain('accessibility flaws');
    });

    it('updates profile display name and syncs session', () => {
      initializeStorageIfNeeded();

      const updated = updateProfile({
        display_name: 'Elena Vance Studio',
      });

      expect(updated.display_name).toBe('Elena Vance Studio');

      const session = getDemoSession();
      expect(session?.user.display_name).toBe('Elena Vance Studio');
    });

    it('handles demo authentication lifecycle without storing passwords', () => {
      // Sign in
      const session = signInDemo('designer@showcase.studio', 'Elena Showcase');
      expect(session.isAuthenticated).toBe(true);
      expect(session.user.email).toBe('designer@showcase.studio');
      expect(session.user.display_name).toBe('Elena Showcase');

      // Verify session read
      expect(getDemoSession()?.isAuthenticated).toBe(true);

      // Sign out
      signOutDemo();
      expect(getDemoSession()).toBeNull();
    });

    it('calculates dashboard metrics accurately', () => {
      initializeStorageIfNeeded();
      const metrics = getDashboardMetrics();

      expect(metrics.totalProjects).toBeGreaterThanOrEqual(3);
      expect(metrics.totalFeedback).toBeGreaterThanOrEqual(5);
      expect(metrics.completionPercentage).toBeGreaterThanOrEqual(0);
      expect(metrics.completionPercentage).toBeLessThanOrEqual(100);
    });

    it('handles corrupted storage data gracefully without throwing', () => {
      // Inject corrupted non-JSON string into storage
      window.localStorage.setItem(STORAGE_KEYS.PROJECTS, '{corrupted-json-invalid');

      // Reading should not crash, but return empty array or default fallback
      expect(() => getProjects()).not.toThrow();
      const projects = getProjects();
      expect(Array.isArray(projects)).toBe(true);
    });

    it('resets storage to clean demo data on command', () => {
      initializeStorageIfNeeded();
      // Clear data
      window.localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify([]));
      expect(getProjects().length).toBe(0);

      // Reset
      resetStorageToDemo();
      expect(getProjects().length).toBeGreaterThanOrEqual(3);
    });
  });
});
