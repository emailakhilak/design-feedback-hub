'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PriorityBadge, StatusBadge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { Project, FeedbackItem } from '@/types';
import { getProjectById, getFeedbackItems } from '@/lib/storage';
import {
  ArrowLeft,
  KanbanSquare,
  Sparkles,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const [project, setProject] = useState<Project | null>(() => {
    if (typeof window !== 'undefined') return getProjectById(projectId);
    return null;
  });
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>(() => {
    if (typeof window !== 'undefined') return getFeedbackItems(projectId);
    return [];
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setProject(getProjectById(projectId));
      setFeedbackList(getFeedbackItems(projectId));
    };
    window.addEventListener('dfh_storage_change', handleStorageChange);
    return () => window.removeEventListener('dfh_storage_change', handleStorageChange);
  }, [projectId]);

  if (!project) {
    return (
      <AppShell title="Project Not Found" description="The requested project was not found in local storage">
        <div className="py-16 text-center space-y-4">
          <p className="text-sm text-stone-500">Project could not be found or was deleted.</p>
          <Link href="/projects">
            <Button size="sm">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Back to Projects</span>
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const todoCount = feedbackList.filter((f) => f.status === 'To Do').length;
  const inProgressCount = feedbackList.filter((f) => f.status === 'In Progress').length;
  const completedCount = feedbackList.filter((f) => f.status === 'Completed').length;
  const completionRate =
    feedbackList.length > 0 ? Math.round((completedCount / feedbackList.length) * 100) : 0;

  return (
    <AppShell
      title={project.title}
      description={`Portfolio Project Details • ${project.category}`}
    >
      <div className="space-y-6 pb-12 max-w-5xl mx-auto">
        {/* Navigation & Actions */}
        <div className="flex items-center justify-between gap-4">
          <Link href="/projects">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <span>Back to Projects</span>
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <Link href={`/feedback?project=${project.id}`}>
              <Button size="sm">
                <KanbanSquare className="w-3.5 h-3.5 mr-1" />
                <span>Open Feedback Board</span>
              </Button>
            </Link>
            <Link href={`/ai-assistant?project=${project.id}`}>
              <Button variant="outline" size="sm" className="text-indigo-600 border-indigo-200 bg-indigo-50/50">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                <span>Run AI Review</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Project Overview Card */}
        <Card className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6 pb-6 border-b border-stone-100">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  {project.category}
                </span>
                <span className="text-stone-300">•</span>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-800 border border-stone-200">
                  {project.status}
                </span>
                <span className="text-stone-300">•</span>
                <span className="text-xs text-stone-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Created {formatDate(project.created_at)}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
                {project.title}
              </h1>
              <p className="text-sm text-stone-600 leading-relaxed max-w-2xl">
                {project.description}
              </p>
            </div>

            {project.project_url && (
              <a
                href={project.project_url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0"
              >
                <Button variant="outline" size="sm">
                  <span>View Live Link</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </a>
            )}
          </div>

          {/* Detailed Context if available */}
          {project.detailed_description && (
            <div className="pt-6">
              <h3 className="text-xs font-semibold text-stone-800 uppercase tracking-wider mb-2">
                Detailed Context & Design Constraints
              </h3>
              <p className="text-xs text-stone-600 whitespace-pre-line leading-relaxed">
                {project.detailed_description}
              </p>
            </div>
          )}
        </Card>

        {/* Feedback Progress Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
              Total Feedback
            </span>
            <div className="text-2xl font-bold text-stone-900">{feedbackList.length}</div>
          </Card>
          <Card className="p-4">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
              To Do
            </span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-stone-800">{todoCount}</span>
              <Clock className="w-4 h-4 text-stone-400" />
            </div>
          </Card>
          <Card className="p-4">
            <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider block mb-1">
              In Progress
            </span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-indigo-600">{inProgressCount}</span>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
          </Card>
          <Card className="p-4">
            <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block mb-1">
              Completed ({completionRate}%)
            </span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-emerald-600">{completedCount}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
          </Card>
        </div>

        {/* Feedback Items Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Project Feedback Log ({feedbackList.length})</CardTitle>
              <CardDescription>
                All logged suggestions and critiques for this project.
              </CardDescription>
            </div>
            <Link href={`/feedback?project=${project.id}`}>
              <Button size="sm" variant="outline">
                Manage on Board &rarr;
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {feedbackList.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-500 bg-stone-50/50 rounded-xl border border-dashed border-stone-200">
                <KanbanSquare className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="font-semibold text-stone-700">No feedback items recorded yet.</p>
                <p className="text-stone-400 mt-0.5">
                  Log mentor or peer feedback to start tracking improvements.
                </p>
                <Link href={`/feedback?project=${project.id}`} className="inline-block mt-3">
                  <Button size="sm">Add First Feedback</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {feedbackList.map((item) => (
                  <div key={item.id} className="py-3.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={item.priority} />
                        <h4 className="text-sm font-semibold text-stone-900">{item.title}</h4>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">{item.comment}</p>
                    <div className="flex items-center gap-3 text-[11px] text-stone-400 pt-1">
                      <span>Category: {item.category}</span>
                      {item.reviewer_name && <span>• Reviewer: {item.reviewer_name}</span>}
                      <span>• Added {formatDate(item.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
