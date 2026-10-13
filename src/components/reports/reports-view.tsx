'use client';

import React, { useState, useMemo } from 'react';
import { Project, FeedbackItem, AiReportRecord, DashboardStats } from '@/types';
import { calculateDashboardStats, formatDate } from '@/lib/utils';
import { generateFeedbackCsv, downloadCsvFile } from '@/lib/utils/csv';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import {
  BarChart3,
  Download,
  FolderGit2,
  KanbanSquare,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileSpreadsheet,
  Sparkles,
} from 'lucide-react';
import { getProjects, getFeedbackItems, getAiReports } from '@/lib/storage';

export interface ReportsViewProps {
  projects?: Project[];
  feedbackList?: FeedbackItem[];
  recentReports?: AiReportRecord[];
}

export function ReportsView({
  projects: propProjects,
  feedbackList: propFeedback,
  recentReports: propReports,
}: ReportsViewProps) {
  const [projects, setProjects] = useState<Project[]>(() => {
    if (typeof window !== 'undefined') return getProjects();
    return propProjects || [];
  });
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>(() => {
    if (typeof window !== 'undefined') return getFeedbackItems();
    return propFeedback || [];
  });
  const [recentReports, setRecentReports] = useState<AiReportRecord[]>(() => {
    if (typeof window !== 'undefined') return getAiReports();
    return propReports || [];
  });

  React.useEffect(() => {
    const handleStorageChange = () => {
      setProjects(getProjects());
      setFeedbackList(getFeedbackItems());
      setRecentReports(getAiReports());
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('dfh_storage_change', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dfh_storage_change', handleStorageChange);
    };
  }, []);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');

  const projectOptions = [
    { label: 'All Projects', value: 'All' },
    ...projects.map((p) => ({ label: p.title, value: p.id })),
  ];

  const statusOptions = [
    { label: 'All Statuses', value: 'All' },
    { label: 'To Do', value: 'To Do' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Completed', value: 'Completed' },
  ];

  const priorityOptions = [
    { label: 'All Priorities', value: 'All' },
    { label: 'Critical', value: 'Critical' },
    { label: 'High', value: 'High' },
    { label: 'Medium', value: 'Medium' },
    { label: 'Low', value: 'Low' },
  ];

  const projectsMap = useMemo(() => {
    const map: Record<string, Project> = {};
    projects.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [projects]);

  // Filtered dataset for report view & export
  const filteredFeedback = useMemo(() => {
    return feedbackList.filter((fb) => {
      const matchProj = selectedProjectId === 'All' || fb.project_id === selectedProjectId;
      const matchStatus = selectedStatus === 'All' || fb.status === selectedStatus;
      const matchPriority = selectedPriority === 'All' || fb.priority === selectedPriority;
      return matchProj && matchStatus && matchPriority;
    });
  }, [feedbackList, selectedProjectId, selectedStatus, selectedPriority]);

  const activeProjects = useMemo(() => {
    if (selectedProjectId === 'All') return projects;
    return projects.filter((p) => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  const stats: DashboardStats = calculateDashboardStats(activeProjects, filteredFeedback);

  // Status distributions
  const statusCounts = useMemo(() => {
    const counts = { 'To Do': 0, 'In Progress': 0, Completed: 0 };
    filteredFeedback.forEach((fb) => {
      if (counts[fb.status] !== undefined) counts[fb.status]++;
    });
    return counts;
  }, [filteredFeedback]);

  // Priority distributions
  const priorityCounts = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    filteredFeedback.forEach((fb) => {
      if (counts[fb.priority] !== undefined) counts[fb.priority]++;
    });
    return counts;
  }, [filteredFeedback]);

  // Category distributions
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    filteredFeedback.forEach((fb) => {
      map[fb.category] = (map[fb.category] || 0) + 1;
    });
    return map;
  }, [filteredFeedback]);

  // CSV Export handler
  const handleExportCsv = () => {
    const csvContent = generateFeedbackCsv(filteredFeedback, projectsMap);
    const dateStr = new Date().toISOString().split('T')[0];
    const projectNameSlug =
      selectedProjectId !== 'All' && projectsMap[selectedProjectId]
        ? projectsMap[selectedProjectId].title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
        : 'all-projects';
    const filename = `design-feedback-${projectNameSlug}-${dateStr}.csv`;
    downloadCsvFile(csvContent, filename);
  };

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-100">
            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
            <span>Audit & Progress Metrics</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
            Reports & CSV Data Export
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
            Examine feedback distribution, completion rates, and export formula-injection protected CSV logs for mentors, clients, or workshop reviewers.
          </p>
        </div>

        <Button size="md" onClick={handleExportCsv} className="shrink-0 shadow-2xs">
          <Download className="w-4 h-4 mr-2" />
          <span>Export Filtered CSV</span>
        </Button>
      </div>

      {/* Filter Ribbon */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs">
        <div className="w-48 sm:w-56">
          <Select
            label="Filter Project"
            options={projectOptions}
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          />
        </div>

        <div className="w-36 sm:w-40">
          <Select
            label="Status"
            options={statusOptions}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          />
        </div>

        <div className="w-36 sm:w-40">
          <Select
            label="Priority"
            options={priorityOptions}
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
          />
        </div>

        <div className="ml-auto flex items-end">
          <span className="text-xs text-stone-400 font-medium pb-2">
            Showing {filteredFeedback.length} of {feedbackList.length} feedback items
          </span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-5">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
            Projects Included
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              {stats.totalProjects}
            </span>
            <FolderGit2 className="w-4 h-4 text-stone-400" />
          </div>
        </Card>

        <Card className="p-5">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
            Feedback Count
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              {filteredFeedback.length}
            </span>
            <KanbanSquare className="w-4 h-4 text-stone-400" />
          </div>
        </Card>

        <Card className="p-5">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
            Completed Tasks
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
              {stats.completedImprovements}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
        </Card>

        <Card className="p-5">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
            Completion Rate
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600">
              {stats.completionPercentage}%
            </span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
        </Card>
      </div>

      {/* Breakdowns: Status & Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card className="p-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <KanbanSquare className="w-4 h-4 text-stone-700" />
              <span>Feedback by Workflow Status</span>
            </CardTitle>
            <CardDescription>
              Progression from initial reviewer comment to completed revision.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-stone-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    To Do (Pending)
                  </span>
                  <span className="font-bold text-stone-900">{statusCounts['To Do']}</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-stone-500 h-2 rounded-full"
                    style={{
                      width: `${filteredFeedback.length ? (statusCounts['To Do'] / filteredFeedback.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-indigo-700 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                    In Progress
                  </span>
                  <span className="font-bold text-indigo-900">{statusCounts['In Progress']}</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{
                      width: `${filteredFeedback.length ? (statusCounts['In Progress'] / filteredFeedback.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Completed
                  </span>
                  <span className="font-bold text-emerald-900">{statusCounts.Completed}</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{
                      width: `${filteredFeedback.length ? (statusCounts.Completed / filteredFeedback.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card className="p-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-stone-700" />
              <span>Feedback by Severity / Priority</span>
            </CardTitle>
            <CardDescription>
              Distribution of reviewer concerns by urgency.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-rose-700">Critical Priority</span>
                  <span className="font-bold text-stone-900">{priorityCounts.Critical}</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-rose-600 h-2 rounded-full"
                    style={{
                      width: `${filteredFeedback.length ? (priorityCounts.Critical / filteredFeedback.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-amber-700">High Priority</span>
                  <span className="font-bold text-stone-900">{priorityCounts.High}</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2 rounded-full"
                    style={{
                      width: `${filteredFeedback.length ? (priorityCounts.High / filteredFeedback.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-blue-700">Medium Priority</span>
                  <span className="font-bold text-stone-900">{priorityCounts.Medium}</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${filteredFeedback.length ? (priorityCounts.Medium / filteredFeedback.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-stone-700">Low Priority</span>
                  <span className="font-bold text-stone-900">{priorityCounts.Low}</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-stone-400 h-2 rounded-full"
                    style={{
                      width: `${filteredFeedback.length ? (priorityCounts.Low / filteredFeedback.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown Table */}
      <Card className="p-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Feedback by Design Discipline / Category</CardTitle>
          <CardDescription>
            Where reviewer attention has been focused across disciplines.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {Object.keys(categoryCounts).length === 0 ? (
            <div className="py-6 text-center text-xs text-stone-400">
              No categories to display.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Object.entries(categoryCounts).map(([cat, count]) => (
                <div
                  key={cat}
                  className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-between text-xs"
                >
                  <span className="font-medium text-stone-700 truncate">{cat}</span>
                  <span className="font-bold text-stone-900 ml-2 bg-white px-2 py-0.5 rounded border border-stone-200">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent AI Reports */}
      {recentReports.length > 0 && (
        <Card className="p-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Recent Gemini AI Reports</span>
            </CardTitle>
            <CardDescription>
              Historical feedback critique sessions generated by Gemini 3.8.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 divide-y divide-stone-100">
            {recentReports.map((report) => (
              <div
                key={report.id}
                className="py-3 flex items-center justify-between gap-4 text-xs"
              >
                <div>
                  <span className="font-semibold text-stone-900">
                    {report.project?.title || 'Portfolio Project'}
                  </span>
                  <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                    {report.structured_result?.summary?.overall_summary || 'Feedback analysis'}
                  </p>
                </div>
                <span className="text-[10px] text-stone-400 shrink-0">
                  {formatDate(report.created_at)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* CSV Export Details & Safety Guarantee */}
      <Card className="p-6 bg-stone-50/70 border-stone-200">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-emerald-100/70 text-emerald-800 shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
              Security Notice: CSV Formula Injection Defense
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              All exported CSV cells are safely sanitized using strict RFC-4180 escaping and formula defense. Any reviewer comment beginning with dangerous spreadsheet triggers (<code className="bg-white px-1 py-0.5 rounded border text-[11px]">=, +, -, @, \t, \r</code>) is prepended with a single quote to prevent code execution when opened in Microsoft Excel, Google Sheets, or Apple Numbers.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
