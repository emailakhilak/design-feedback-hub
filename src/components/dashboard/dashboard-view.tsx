'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Project, FeedbackItem, DashboardStats } from '@/types';
import { calculateDashboardStats, formatDate } from '@/lib/utils';
import { getProjects, getFeedbackItems, getProfile } from '@/lib/storage';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PriorityBadge, StatusBadge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import {
  FolderGit2,
  KanbanSquare,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ArrowRight,
  ExternalLink,
  Clock,
  TrendingUp,
  HardDrive,
} from 'lucide-react';

export interface DashboardViewProps {
  initialProjects?: Project[];
  initialFeedback?: FeedbackItem[];
  userEmail?: string;
  displayName?: string;
  geminiConfigured?: boolean;
}

export function DashboardView({
  initialProjects,
  initialFeedback,
  displayName: propName,
  geminiConfigured = true,
}: DashboardViewProps) {
  const [projects, setProjects] = useState<Project[]>(() => {
    if (typeof window !== 'undefined') return getProjects();
    return initialProjects || [];
  });
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>(() => {
    if (typeof window !== 'undefined') return getFeedbackItems();
    return initialFeedback || [];
  });
  const [displayName, setDisplayName] = useState(() => {
    if (propName) return propName;
    if (typeof window !== 'undefined') {
      const p = getProfile();
      return p.display_name || 'Alex Rivera';
    }
    return 'Alex Rivera';
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setProjects(getProjects());
      setFeedbackList(getFeedbackItems());
      const p = getProfile();
      if (p.display_name) setDisplayName(p.display_name);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('dfh_storage_change', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dfh_storage_change', handleStorageChange);
    };
  }, []);

  const stats: DashboardStats = calculateDashboardStats(projects, feedbackList);

  // High priority items requiring attention (Critical or High, not completed)
  const urgentItems = feedbackList.filter(
    (fb) => (fb.priority === 'Critical' || fb.priority === 'High') && fb.status !== 'Completed'
  );

  // Recent projects (latest 4)
  const recentProjects = [...projects].slice(0, 4);

  // Recent feedback (latest 5)
  const recentFeedback = [...feedbackList].slice(0, 5);

  return (
    <div className="space-y-8 pb-12">
      {/* Local Storage & AI Status Banners */}
      {!geminiConfigured && (
        <Alert variant="info" title="Google Gemini AI Integration Ready">
          To enable real AI feedback synthesis and smart task generation, add your{' '}
          <code className="bg-blue-100 font-mono px-1 py-0.5 rounded text-[11px]">GEMINI_API_KEY</code> from Google AI Studio to{' '}
          <code className="bg-blue-100 font-mono px-1 py-0.5 rounded text-[11px]">.env.local</code>.
        </Alert>
      )}

      {/* Welcome Banner */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[11px] font-medium border border-stone-200">
            <HardDrive className="w-3.5 h-3.5 text-stone-500" />
            <span>Local Storage Active</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
            Welcome back, {displayName || 'Portfolio Designer'}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
            Manage your design iterations, review mentor suggestions, and run Google Gemini feedback analysis to refine your showcase pieces.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link href="/projects">
            <Button size="sm" className="shadow-2xs">
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Create Project</span>
            </Button>
          </Link>
          <Link href="/ai-assistant">
            <Button variant="outline" size="sm" className="text-indigo-600 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-600" />
              <span>Analyze with Gemini</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <Card className="p-4 sm:p-5">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
            Total Projects
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              {stats.totalProjects}
            </span>
            <FolderGit2 className="w-4 h-4 text-stone-400" />
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">In your portfolio</span>
        </Card>

        <Card className="p-4 sm:p-5">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
            Total Feedback
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              {stats.totalFeedback}
            </span>
            <KanbanSquare className="w-4 h-4 text-stone-400" />
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">Reviewer comments</span>
        </Card>

        <Card className="p-4 sm:p-5">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
            Pending (To Do)
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              {stats.pendingImprovements}
            </span>
            <Clock className="w-4 h-4 text-stone-400" />
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">Action items awaiting start</span>
        </Card>

        <Card className="p-4 sm:p-5">
          <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider block mb-1">
            In Progress
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600">
              {stats.inProgressImprovements}
            </span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">Being revised now</span>
        </Card>

        <Card className="p-4 sm:p-5 col-span-2 lg:col-span-1">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block mb-1">
            Completed ({stats.completionPercentage}%)
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
              {stats.completedImprovements}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          {/* Progress bar */}
          <div className="w-full bg-stone-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${stats.completionPercentage}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Main Grid: Urgent Attention & Recent Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Urgent Attention + Recent Projects */}
        <div className="lg:col-span-2 space-y-6">
          {/* High Priority Attention Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>High-Priority Items Requiring Attention</span>
                </CardTitle>
                <CardDescription>
                  Critical and high-severity feedback items that have not yet been marked completed.
                </CardDescription>
              </div>
              <Link href="/feedback">
                <Button variant="ghost" size="sm">
                  View Board
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {urgentItems.length === 0 ? (
                <div className="py-8 text-center bg-stone-50/50 rounded-xl border border-dashed border-stone-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="text-xs font-semibold text-stone-800">
                    No critical issues pending!
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    All high-priority feedback items are resolved or none have been logged.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {urgentItems.slice(0, 4).map((item) => (
                    <div key={item.id} className="py-3 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <PriorityBadge priority={item.priority} />
                          <span className="text-xs font-semibold text-stone-900">
                            {item.title}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 line-clamp-1">
                          {item.comment}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-stone-400">
                          <span>Category: {item.category}</span>
                          {item.reviewer_name && <span>• By {item.reviewer_name}</span>}
                        </div>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Portfolio Projects */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Recent Portfolio Projects</CardTitle>
                <CardDescription>
                  Your latest design case studies and live review boards.
                </CardDescription>
              </div>
              <Link href="/projects">
                <Button variant="ghost" size="sm">
                  <span>All Projects</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentProjects.length === 0 ? (
                <div className="py-10 text-center bg-stone-50/50 rounded-xl border border-dashed border-stone-200">
                  <FolderGit2 className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                  <h4 className="text-xs font-semibold text-stone-800">No projects created yet</h4>
                  <p className="text-[11px] text-stone-500 mt-1 max-w-sm mx-auto">
                    Add your first portfolio case study to start gathering critique and running AI audits.
                  </p>
                  <Link href="/projects" className="inline-block mt-4">
                    <Button size="sm">
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Create First Project
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recentProjects.map((p) => (
                    <div
                      key={p.id}
                      className="border border-stone-200 rounded-xl p-4 hover:border-stone-300 transition-colors bg-white flex flex-col justify-between"
                    >
                      <div className="space-y-1.5 mb-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                            {p.category}
                          </span>
                          <span className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-medium">
                            {p.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-stone-900 line-clamp-1">
                          {p.title}
                        </h4>
                        <p className="text-xs text-stone-500 line-clamp-2">
                          {p.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-stone-400">
                          {formatDate(p.created_at)}
                        </span>
                        <div className="flex items-center gap-2">
                          <Link href={`/feedback?project=${p.id}`}>
                            <span className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline">
                              Feedback Board &rarr;
                            </span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): Recent Feedback & Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <Card className="bg-stone-900 text-stone-50 border-stone-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-stone-50 text-base">Quick Actions</CardTitle>
              <CardDescription className="text-stone-400">
                Fast shortcuts to your primary workflow actions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-2">
              <Link href="/projects" className="block">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-stone-100 bg-stone-800/80 border-stone-700 hover:bg-stone-800 hover:text-white"
                >
                  <Plus className="w-3.5 h-3.5 mr-2 text-indigo-400" />
                  <span>Add Portfolio Project</span>
                </Button>
              </Link>

              <Link href="/feedback" className="block">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-stone-100 bg-stone-800/80 border-stone-700 hover:bg-stone-800 hover:text-white"
                >
                  <KanbanSquare className="w-3.5 h-3.5 mr-2 text-emerald-400" />
                  <span>Log Reviewer Feedback</span>
                </Button>
              </Link>

              <Link href="/ai-assistant" className="block">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-stone-100 bg-stone-800/80 border-stone-700 hover:bg-stone-800 hover:text-white"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-2 text-purple-400" />
                  <span>Run Gemini Design Critique</span>
                </Button>
              </Link>

              <Link href="/reports" className="block">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-stone-100 bg-stone-800/80 border-stone-700 hover:bg-stone-800 hover:text-white"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-2 text-blue-400" />
                  <span>Export CSV Report</span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Feedback Feed */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm">Recent Feedback</CardTitle>
                <CardDescription>Latest suggestions logged</CardDescription>
              </div>
              <Link href="/feedback">
                <Button variant="ghost" size="sm" className="text-xs">
                  All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentFeedback.length === 0 ? (
                <div className="py-6 text-center text-xs text-stone-400">
                  No feedback items yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentFeedback.map((fb) => (
                    <div
                      key={fb.id}
                      className="p-3 bg-stone-50/70 rounded-lg border border-stone-100 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-stone-900 line-clamp-1">
                          {fb.title}
                        </span>
                        <PriorityBadge priority={fb.priority} />
                      </div>
                      <p className="text-stone-500 line-clamp-2">{fb.comment}</p>
                      <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1">
                        <span>{fb.category}</span>
                        <StatusBadge status={fb.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
