import {
  Project,
  FeedbackItem,
  AiReportRecord,
  Profile,
  FeedbackStatus,
  DashboardStats,
} from '@/types';

// Storage keys
export const STORAGE_KEYS = {
  PROJECTS: 'dfh_projects',
  FEEDBACK: 'dfh_feedback',
  AI_REPORTS: 'dfh_ai_reports',
  PROFILE: 'dfh_profile',
  SESSION: 'dfh_demo_session',
  SETTINGS: 'dfh_app_settings',
} as const;

export interface DemoUser {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
}

export interface DemoSession {
  user: DemoUser;
  isAuthenticated: boolean;
  signedInAt: string;
}

export interface AppSettings {
  theme: 'system' | 'light' | 'dark';
  notificationsEnabled: boolean;
  compactView: boolean;
}

/**
 * Generate a cryptographically random UUID v4 string
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback RFC4122 v4 UUID generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Check if browser LocalStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const testKey = '__dfh_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safe LocalStorage reader with JSON parsing & error fallback
 */
function safeGetItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`[LocalStorage] Failed to parse item for key "${key}":`, error);
    return fallback;
  }
}

/**
 * Safe LocalStorage writer with error handling
 */
function safeSetItem<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    try {
      window.dispatchEvent(new Event('dfh_storage_change'));
    } catch {
      // ignore
    }
    return true;
  } catch (error) {
    console.error(`[LocalStorage] Failed to save item for key "${key}":`, error);
    return false;
  }
}

// ============================================================================
// DEFAULT SEED DATA
// Pre-populates the workspace so the user / reviewer immediately experiences
// rich interactive design portfolio features (Kanban, AI synthesis, CSV export)
// ============================================================================

export const DEFAULT_DEMO_USER: DemoUser = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'alex.designer@portfolio.design',
  display_name: 'Alex Rivera',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
};

const DEFAULT_PROJECT_1_ID = '11111111-1111-4111-8111-111111111111';
const DEFAULT_PROJECT_2_ID = '22222222-2222-4222-8222-222222222222';
const DEFAULT_PROJECT_3_ID = '33333333-3333-4333-8333-333333333333';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: DEFAULT_PROJECT_1_ID,
    user_id: DEFAULT_DEMO_USER.id,
    title: 'Fintech Mobile Banking Experience',
    description: 'A modern, accessible personal finance and wealth management app designed for Gen Z and Millennials.',
    detailed_description: 'Key design goals included simplifying multi-currency transfers, offering biometric quick-pay, and providing transparent card controls with clear visual hierarchy.',
    category: 'Mobile App',
    preview_image_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800',
    project_url: 'https://figma.com/@portfolio/fintech-app',
    status: 'In Review',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: DEFAULT_PROJECT_2_ID,
    user_id: DEFAULT_DEMO_USER.id,
    title: 'Aurora Design System v2.0',
    description: 'A comprehensive multi-brand component library and token architecture built for web and native platforms.',
    detailed_description: 'Covers WCAG AAA accessible typography scales, color contrast tokens, interactive states, and responsive data visualization primitives.',
    category: 'UI/UX Design',
    preview_image_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800',
    project_url: 'https://storybook.example.com',
    status: 'Improving',
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: DEFAULT_PROJECT_3_ID,
    user_id: DEFAULT_DEMO_USER.id,
    title: 'Kinetic Studio Portfolio Site',
    description: 'Editorial agency portfolio featuring smooth interactions, scroll-driven storytelling, and case studies.',
    detailed_description: 'Showcases interactive 3D case study models, micro-interactions, and high-performance WebP media streaming.',
    category: 'Web Design',
    preview_image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
    project_url: 'https://kinetic-studio.example.com',
    status: 'Completed',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

export const INITIAL_FEEDBACK: FeedbackItem[] = [
  {
    id: 'f1111111-1111-4111-8111-111111111111',
    project_id: DEFAULT_PROJECT_1_ID,
    user_id: DEFAULT_DEMO_USER.id,
    title: 'Biometric transfer button fails 4.5:1 contrast',
    comment: 'The muted teal text inside the primary confirm button fails WCAG AA against the white background under sunlight. Recommend bumping to dark teal #0E4E49.',
    reviewer_name: 'Elena Rostova (Accessibility Lead)',
    category: 'Color and Contrast',
    priority: 'Critical',
    status: 'To Do',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'f2222222-2222-4222-8222-222222222222',
    project_id: DEFAULT_PROJECT_1_ID,
    user_id: DEFAULT_DEMO_USER.id,
    title: 'Account selector drawer requires back-button support',
    comment: 'On Android devices, pressing physical back button closes entire app instead of dismissing the account switch sheet.',
    reviewer_name: 'Marcus Chen (Staff Android Eng)',
    category: 'Navigation',
    priority: 'High',
    status: 'In Progress',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'f3333333-3333-4333-8333-333333333333',
    project_id: DEFAULT_PROJECT_1_ID,
    user_id: DEFAULT_DEMO_USER.id,
    title: 'Currency conversion decimal alignment looks clean',
    comment: 'Tabular numeral styling on conversion tables is crisp and reads effortlessly across viewport sizes. Great attention to typography.',
    reviewer_name: 'Sophia Patel (Senior Product Designer)',
    category: 'Typography',
    priority: 'Low',
    status: 'Completed',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'f4444444-4444-4444-8444-444444444444',
    project_id: DEFAULT_PROJECT_2_ID,
    user_id: DEFAULT_DEMO_USER.id,
    title: 'Modal focus trap missing on keyboard Tab navigation',
    comment: 'When opening the dialog component, keyboard focus escapes into background DOM elements instead of cycling within dialog buttons.',
    reviewer_name: 'Devin Taylor (QA Accessibility)',
    category: 'Accessibility',
    priority: 'High',
    status: 'To Do',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'f5555555-5555-4555-8555-555555555555',
    project_id: DEFAULT_PROJECT_2_ID,
    user_id: DEFAULT_DEMO_USER.id,
    title: 'Add skeleton loading states to card grids',
    comment: 'Card grid flashes empty before data loads. Introducing animated skeleton placeholders will improve perceived latency.',
    reviewer_name: 'Maya Lin (UX Researcher)',
    category: 'Usability',
    priority: 'Medium',
    status: 'In Progress',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'f6666666-6666-4666-8666-666666666666',
    project_id: DEFAULT_PROJECT_3_ID,
    user_id: DEFAULT_DEMO_USER.id,
    title: 'Hero video poster image falls back gracefully',
    comment: 'Verified hero media loads quickly on 3G throttling thanks to modern WebP compression. Perfect execution.',
    reviewer_name: 'David Kim (Creative Director)',
    category: 'Performance',
    priority: 'Low',
    status: 'Completed',
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

/**
 * Initialize storage with default data if empty
 */
export function initializeStorageIfNeeded(): void {
  if (typeof window === 'undefined') return;

  const existingProjects = window.localStorage.getItem(STORAGE_KEYS.PROJECTS);
  if (!existingProjects) {
    safeSetItem(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  }

  const existingFeedback = window.localStorage.getItem(STORAGE_KEYS.FEEDBACK);
  if (!existingFeedback) {
    safeSetItem(STORAGE_KEYS.FEEDBACK, INITIAL_FEEDBACK);
  }

  const existingProfile = window.localStorage.getItem(STORAGE_KEYS.PROFILE);
  if (!existingProfile) {
    const profile: Profile = {
      id: DEFAULT_DEMO_USER.id,
      display_name: DEFAULT_DEMO_USER.display_name,
      avatar_url: DEFAULT_DEMO_USER.avatar_url,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    safeSetItem(STORAGE_KEYS.PROFILE, profile);
  }

  const hasEverInitialized = window.localStorage.getItem('dfh_initialized');
  if (!hasEverInitialized) {
    const session: DemoSession = {
      user: DEFAULT_DEMO_USER,
      isAuthenticated: true,
      signedInAt: new Date().toISOString(),
    };
    safeSetItem(STORAGE_KEYS.SESSION, session);
    try {
      window.localStorage.setItem('dfh_initialized', 'true');
    } catch {
      // ignore
    }
  }
}

/**
 * Reset all LocalStorage to initial clean demo data
 */
export function resetStorageToDemo(): void {
  if (typeof window === 'undefined') return;
  safeSetItem(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  safeSetItem(STORAGE_KEYS.FEEDBACK, INITIAL_FEEDBACK);
  safeSetItem(STORAGE_KEYS.AI_REPORTS, []);
  const profile: Profile = {
    id: DEFAULT_DEMO_USER.id,
    display_name: DEFAULT_DEMO_USER.display_name,
    avatar_url: DEFAULT_DEMO_USER.avatar_url,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  safeSetItem(STORAGE_KEYS.PROFILE, profile);
  const session: DemoSession = {
    user: DEFAULT_DEMO_USER,
    isAuthenticated: true,
    signedInAt: new Date().toISOString(),
  };
  safeSetItem(STORAGE_KEYS.SESSION, session);
}

// ============================================================================
// PROJECTS CRUD
// ============================================================================

export function getProjects(): Project[] {
  initializeStorageIfNeeded();
  const projects = safeGetItem<Project[]>(STORAGE_KEYS.PROJECTS, []);
  const feedbackList = getFeedbackItems();

  // Compute live feedback counts dynamically
  return projects.map((p) => {
    const pFeedback = feedbackList.filter((f) => f.project_id === p.id);
    return {
      ...p,
      feedback_count: pFeedback.length,
      completed_count: pFeedback.filter((f) => f.status === 'Completed').length,
    };
  });
}

export function getProjectById(id: string): Project | null {
  const projects = getProjects();
  return projects.find((p) => p.id === id) || null;
}

export function createProject(
  data: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'feedback_count' | 'completed_count'>
): Project {
  initializeStorageIfNeeded();
  const projects = safeGetItem<Project[]>(STORAGE_KEYS.PROJECTS, []);
  const now = new Date().toISOString();

  const newProject: Project = {
    ...data,
    id: generateId(),
    created_at: now,
    updated_at: now,
    feedback_count: 0,
    completed_count: 0,
  };

  projects.unshift(newProject);
  safeSetItem(STORAGE_KEYS.PROJECTS, projects);
  return newProject;
}

export function updateProject(id: string, updates: Partial<Project>): Project | null {
  initializeStorageIfNeeded();
  const projects = safeGetItem<Project[]>(STORAGE_KEYS.PROJECTS, []);
  const index = projects.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const updated: Project = {
    ...projects[index],
    ...updates,
    id, // protect id
    updated_at: new Date().toISOString(),
  };

  projects[index] = updated;
  safeSetItem(STORAGE_KEYS.PROJECTS, projects);
  return updated;
}

/**
 * Delete a project and CASCADE delete its feedback items and AI reports
 */
export function deleteProject(id: string): boolean {
  initializeStorageIfNeeded();
  const projects = safeGetItem<Project[]>(STORAGE_KEYS.PROJECTS, []);
  const filteredProjects = projects.filter((p) => p.id !== id);

  if (filteredProjects.length === projects.length) return false;

  safeSetItem(STORAGE_KEYS.PROJECTS, filteredProjects);

  // Cascade delete feedback items for this project
  const feedback = safeGetItem<FeedbackItem[]>(STORAGE_KEYS.FEEDBACK, []);
  const filteredFeedback = feedback.filter((f) => f.project_id !== id);
  safeSetItem(STORAGE_KEYS.FEEDBACK, filteredFeedback);

  // Cascade delete AI reports for this project
  const reports = safeGetItem<AiReportRecord[]>(STORAGE_KEYS.AI_REPORTS, []);
  const filteredReports = reports.filter((r) => r.project_id !== id);
  safeSetItem(STORAGE_KEYS.AI_REPORTS, filteredReports);

  return true;
}

// ============================================================================
// FEEDBACK CRUD & KANBAN STATUS UPDATES
// ============================================================================

export function getFeedbackItems(projectId?: string): FeedbackItem[] {
  initializeStorageIfNeeded();
  const items = safeGetItem<FeedbackItem[]>(STORAGE_KEYS.FEEDBACK, []);
  const projects = safeGetItem<Project[]>(STORAGE_KEYS.PROJECTS, []);
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  // Attach project summary metadata for display in global board
  const enriched = items.map((item) => {
    const proj = projectMap.get(item.project_id);
    return {
      ...item,
      project: proj ? { id: proj.id, title: proj.title, category: proj.category } : null,
    };
  });

  if (projectId) {
    return enriched.filter((item) => item.project_id === projectId);
  }

  return enriched;
}

export function getFeedbackById(id: string): FeedbackItem | null {
  const items = getFeedbackItems();
  return items.find((f) => f.id === id) || null;
}

export function createFeedbackItem(
  data: Omit<FeedbackItem, 'id' | 'created_at' | 'updated_at' | 'project'>
): FeedbackItem {
  initializeStorageIfNeeded();
  const items = safeGetItem<FeedbackItem[]>(STORAGE_KEYS.FEEDBACK, []);
  const now = new Date().toISOString();

  const newItem: FeedbackItem = {
    ...data,
    id: generateId(),
    created_at: now,
    updated_at: now,
  };

  items.unshift(newItem);
  safeSetItem(STORAGE_KEYS.FEEDBACK, items);
  return newItem;
}

export function updateFeedbackItem(id: string, updates: Partial<FeedbackItem>): FeedbackItem | null {
  initializeStorageIfNeeded();
  const items = safeGetItem<FeedbackItem[]>(STORAGE_KEYS.FEEDBACK, []);
  const index = items.findIndex((f) => f.id === id);
  if (index === -1) return null;

  const updated: FeedbackItem = {
    ...items[index],
    ...updates,
    id, // protect id
    project_id: updates.project_id || items[index].project_id,
    updated_at: new Date().toISOString(),
  };

  items[index] = updated;
  safeSetItem(STORAGE_KEYS.FEEDBACK, items);
  return updated;
}

/**
 * Update Kanban status: 'To Do' | 'In Progress' | 'Completed'
 */
export function updateFeedbackStatus(id: string, status: FeedbackStatus): FeedbackItem | null {
  return updateFeedbackItem(id, { status });
}

export function deleteFeedbackItem(id: string): boolean {
  initializeStorageIfNeeded();
  const items = safeGetItem<FeedbackItem[]>(STORAGE_KEYS.FEEDBACK, []);
  const filtered = items.filter((f) => f.id !== id);

  if (filtered.length === items.length) return false;

  safeSetItem(STORAGE_KEYS.FEEDBACK, filtered);
  return true;
}

// ============================================================================
// AI REPORTS STORAGE
// ============================================================================

export function getAiReports(projectId?: string): AiReportRecord[] {
  initializeStorageIfNeeded();
  const reports = safeGetItem<AiReportRecord[]>(STORAGE_KEYS.AI_REPORTS, []);
  const projects = safeGetItem<Project[]>(STORAGE_KEYS.PROJECTS, []);
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const enriched = reports.map((r) => {
    const proj = projectMap.get(r.project_id);
    return {
      ...r,
      project: proj ? { id: proj.id, title: proj.title } : null,
    };
  });

  if (projectId) {
    return enriched.filter((r) => r.project_id === projectId);
  }

  return enriched;
}

export function saveAiReport(
  report: Omit<AiReportRecord, 'id' | 'created_at'>
): AiReportRecord {
  initializeStorageIfNeeded();
  const reports = safeGetItem<AiReportRecord[]>(STORAGE_KEYS.AI_REPORTS, []);
  const now = new Date().toISOString();

  const newReport: AiReportRecord = {
    ...report,
    id: generateId(),
    created_at: now,
  };

  reports.unshift(newReport);
  safeSetItem(STORAGE_KEYS.AI_REPORTS, reports);
  return newReport;
}

// ============================================================================
// PROFILE & SETTINGS STORAGE
// ============================================================================

export function getProfile(): Profile {
  initializeStorageIfNeeded();
  return safeGetItem<Profile>(STORAGE_KEYS.PROFILE, {
    id: DEFAULT_DEMO_USER.id,
    display_name: DEFAULT_DEMO_USER.display_name,
    avatar_url: DEFAULT_DEMO_USER.avatar_url,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

export function updateProfile(updates: Partial<Profile>): Profile {
  initializeStorageIfNeeded();
  const current = getProfile();
  const updated: Profile = {
    ...current,
    ...updates,
    updated_at: new Date().toISOString(),
  };
  safeSetItem(STORAGE_KEYS.PROFILE, updated);

  // Keep demo session in sync if display_name changed
  const session = getDemoSession();
  if (session && updates.display_name) {
    session.user.display_name = updates.display_name;
    if (updates.avatar_url !== undefined) {
      session.user.avatar_url = updates.avatar_url || undefined;
    }
    safeSetItem(STORAGE_KEYS.SESSION, session);
  }

  return updated;
}

// ============================================================================
// LOCAL DEMO AUTHENTICATION
// Note: Clearly documented as demo-only client authentication.
// Passwords are never stored in LocalStorage.
// ============================================================================

export function getDemoSession(): DemoSession | null {
  initializeStorageIfNeeded();
  const session = safeGetItem<DemoSession | null>(STORAGE_KEYS.SESSION, null);
  if (!session || !session.isAuthenticated) return null;
  return session;
}

export function signInDemo(email: string, displayName?: string): DemoSession {
  initializeStorageIfNeeded();
  const profile = getProfile();
  const user: DemoUser = {
    id: profile.id || generateId(),
    email: email.trim().toLowerCase() || DEFAULT_DEMO_USER.email,
    display_name: displayName?.trim() || profile.display_name || 'Portfolio Designer',
    avatar_url: profile.avatar_url || undefined,
  };

  const session: DemoSession = {
    user,
    isAuthenticated: true,
    signedInAt: new Date().toISOString(),
  };

  safeSetItem(STORAGE_KEYS.SESSION, session);
  return session;
}

export function signUpDemo(email: string, displayName: string): DemoSession {
  return signInDemo(email, displayName);
}

export function signOutDemo(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEYS.SESSION);
    try {
      window.dispatchEvent(new Event('dfh_storage_change'));
    } catch {
      // ignore
    }
  } catch (error) {
    console.warn('[LocalStorage] Failed to clear session:', error);
  }
}

// ============================================================================
// DASHBOARD METRICS CALCULATION
// ============================================================================

export function getDashboardMetrics(): DashboardStats {
  const projects = getProjects();
  const feedback = getFeedbackItems();

  const totalProjects = projects.length;
  const totalFeedback = feedback.length;
  const pendingImprovements = feedback.filter((f) => f.status === 'To Do').length;
  const inProgressImprovements = feedback.filter((f) => f.status === 'In Progress').length;
  const completedImprovements = feedback.filter((f) => f.status === 'Completed').length;

  const completionPercentage =
    totalFeedback > 0 ? Math.round((completedImprovements / totalFeedback) * 100) : 0;

  return {
    totalProjects,
    totalFeedback,
    pendingImprovements,
    inProgressImprovements,
    completedImprovements,
    completionPercentage,
  };
}
