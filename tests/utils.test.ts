import { describe, it, expect } from 'vitest';
import { sanitizeForCsv, generateFeedbackCsv } from '@/lib/utils/csv';
import { calculateDashboardStats } from '@/lib/utils';
import { FeedbackItem, Project } from '@/types';

describe('CSV Escaping and Formula Injection Protection', () => {
  it('correctly passes safe alphanumeric text unchanged', () => {
    expect(sanitizeForCsv('Design revision 1')).toBe('Design revision 1');
    expect(sanitizeForCsv('Typography')).toBe('Typography');
  });

  it('escapes cells containing commas, double quotes, and newlines per RFC-4180', () => {
    expect(sanitizeForCsv('Button, Primary')).toBe('"Button, Primary"');
    expect(sanitizeForCsv('Quote "Here"')).toBe('"Quote ""Here"""');
    expect(sanitizeForCsv('Line 1\nLine 2')).toBe('"Line 1\nLine 2"');
  });

  it('defends against formula injection starting with =, +, -, @, tab, or carriage return', () => {
    // Dangerous spreadsheet injection inputs
    const dangerousEqual = '=SUM(A1:A10)';
    const dangerousPlus = '+cmd| /C calc!A0';
    const dangerousMinus = '-2+3+cmd';
    const dangerousAt = '@SUM(1+1)';
    const dangerousTab = '\tmalicious';
    const dangerousCr = '\rmalicious';

    expect(sanitizeForCsv(dangerousEqual)).toBe(`"'=SUM(A1:A10)"`);
    expect(sanitizeForCsv(dangerousPlus)).toBe(`"'+cmd| /C calc!A0"`);
    expect(sanitizeForCsv(dangerousMinus)).toBe(`"'-2+3+cmd"`);
    expect(sanitizeForCsv(dangerousAt)).toBe(`"'@SUM(1+1)"`);
    expect(sanitizeForCsv(dangerousTab)).toBe(`"'\tmalicious"`);
    expect(sanitizeForCsv(dangerousCr)).toBe(`"'\rmalicious"`);
  });

  it('generates full CSV string with headers and correctly formatted rows', () => {
    const mockProject: Project = {
      id: 'proj-1',
      user_id: 'user-1',
      title: 'Mobile Banking App',
      description: 'Fintech app design',
      category: 'Mobile App',
      status: 'In Review',
      created_at: '2026-10-10T12:00:00Z',
      updated_at: '2026-10-10T12:00:00Z',
    };

    const mockFeedback: FeedbackItem[] = [
      {
        id: 'fb-1',
        project_id: 'proj-1',
        user_id: 'user-1',
        title: 'Contrast on CTA = dangerous',
        comment: 'The primary button needs more contrast, specifically 4.5:1 ratio.',
        reviewer_name: 'Sarah Mentor',
        category: 'Color and Contrast',
        priority: 'High',
        status: 'To Do',
        created_at: '2026-10-11T10:00:00Z',
        updated_at: '2026-10-11T10:00:00Z',
        project: {
          id: 'proj-1',
          title: 'Mobile Banking App',
        },
      },
    ];

    const csv = generateFeedbackCsv(mockFeedback, { 'proj-1': mockProject });
    const lines = csv.split('\r\n');

    expect(lines.length).toBe(2);
    expect(lines[0]).toContain('Project Title,Project Category,Feedback Title');
    // Notice formula trigger in title: "Contrast on CTA = dangerous" contains equal in middle so safe, but if leading it prepends single quote
    expect(lines[1]).toContain('Mobile Banking App');
    expect(lines[1]).toContain('"The primary button needs more contrast, specifically 4.5:1 ratio."');
  });
});

describe('Dashboard Statistics Calculations', () => {
  it('correctly calculates empty state stats', () => {
    const stats = calculateDashboardStats([], []);
    expect(stats.totalProjects).toBe(0);
    expect(stats.totalFeedback).toBe(0);
    expect(stats.pendingImprovements).toBe(0);
    expect(stats.inProgressImprovements).toBe(0);
    expect(stats.completedImprovements).toBe(0);
    expect(stats.completionPercentage).toBe(0);
  });

  it('correctly categorizes feedback status and computes completion percentage', () => {
    const projects: Project[] = [
      {
        id: 'p1',
        user_id: 'u1',
        title: 'Project 1',
        description: 'Desc',
        category: 'UI/UX Design',
        status: 'Improving',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
      {
        id: 'p2',
        user_id: 'u1',
        title: 'Project 2',
        description: 'Desc',
        category: 'Web Design',
        status: 'Completed',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
    ];

    const feedbackList: FeedbackItem[] = [
      {
        id: 'f1',
        project_id: 'p1',
        user_id: 'u1',
        title: 'Task 1',
        comment: 'Comment 1',
        category: 'Accessibility',
        priority: 'High',
        status: 'To Do',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
      {
        id: 'f2',
        project_id: 'p1',
        user_id: 'u1',
        title: 'Task 2',
        comment: 'Comment 2',
        category: 'Usability',
        priority: 'Medium',
        status: 'In Progress',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
      {
        id: 'f3',
        project_id: 'p1',
        user_id: 'u1',
        title: 'Task 3',
        comment: 'Comment 3',
        category: 'Typography',
        priority: 'Low',
        status: 'Completed',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
      {
        id: 'f4',
        project_id: 'p2',
        user_id: 'u1',
        title: 'Task 4',
        comment: 'Comment 4',
        category: 'Navigation',
        priority: 'Critical',
        status: 'Completed',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
    ];

    const stats = calculateDashboardStats(projects, feedbackList);
    expect(stats.totalProjects).toBe(2);
    expect(stats.totalFeedback).toBe(4);
    expect(stats.pendingImprovements).toBe(1); // 'To Do'
    expect(stats.inProgressImprovements).toBe(1); // 'In Progress'
    expect(stats.completedImprovements).toBe(2); // 'Completed'
    expect(stats.completionPercentage).toBe(50); // 2 out of 4 = 50%
  });
});
