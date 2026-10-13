export type ProjectCategory =
  | 'UI/UX Design'
  | 'Web Design'
  | 'Mobile App'
  | 'Branding'
  | 'Graphic Design'
  | 'Other';

export type ProjectStatus = 'Draft' | 'In Review' | 'Improving' | 'Completed';

export type FeedbackCategory =
  | 'Visual Design'
  | 'Usability'
  | 'Accessibility'
  | 'Typography'
  | 'Color and Contrast'
  | 'Navigation'
  | 'Responsiveness'
  | 'Performance'
  | 'Other';

export type FeedbackPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type FeedbackStatus = 'To Do' | 'In Progress' | 'Completed';

export interface Profile {
  id: string;
  display_name: string;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;
  detailed_description?: string | null;
  category: ProjectCategory;
  preview_image_url?: string | null;
  project_url?: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  // Computed client-side or joined
  feedback_count?: number;
  completed_count?: number;
}

export interface FeedbackItem {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  comment: string;
  reviewer_name?: string | null;
  category: FeedbackCategory;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    title: string;
    category?: string;
  } | null;
}

export interface SmartRecommendation {
  id: string;
  title: string;
  explanation: string;
  supporting_feedback: string[];
  suggested_priority: FeedbackPriority;
  estimated_effort: 'Small' | 'Medium' | 'Large';
  concrete_steps: string[];
  expected_benefit: string;
  confidence: 'High' | 'Medium' | 'Low';
}

export interface ActionableTask {
  id: string;
  title: string;
  comment: string;
  category: FeedbackCategory;
  priority: FeedbackPriority;
  suggested_status: FeedbackStatus;
}

export interface FeedbackSummary {
  overall_summary: string;
  recurring_issues: string[];
  positive_observations: string[];
  usability_concerns: string[];
  accessibility_concerns: string[];
  areas_for_investigation: string[];
}

export interface ProjectReview {
  strengths: string[];
  areas_for_improvement: string[];
  actionable_recommendations: string[];
  order_of_work: string[];
  next_steps_plan: string;
}

export interface AiAnalysisResult {
  summary: FeedbackSummary;
  recommendations: SmartRecommendation[];
  actionable_tasks: ActionableTask[];
  project_review: ProjectReview;
}

export interface AiReportRecord {
  id: string;
  project_id: string;
  user_id: string;
  report_type: string;
  structured_result: AiAnalysisResult;
  created_at: string;
  project?: {
    id: string;
    title: string;
  } | null;
}

export interface DashboardStats {
  totalProjects: number;
  totalFeedback: number;
  pendingImprovements: number; // To Do
  inProgressImprovements: number; // In Progress
  completedImprovements: number; // Completed
  completionPercentage: number;
}
