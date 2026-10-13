'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Project, AiAnalysisResult, AiReportRecord } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { PriorityBadge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import {
  getProjects,
  getFeedbackItems,
  getAiReports,
  saveAiReport,
  createFeedbackItem,
  getDemoSession,
  DEFAULT_DEMO_USER,
} from '@/lib/storage';
import { formatDate } from '@/lib/utils';
import {
  Sparkles,
  Bot,
  Copy,
  Check,
  CheckCircle2,
  Flame,
  ShieldCheck,
  Layers,
  ListTodo,
  KanbanSquare,
  History,
} from 'lucide-react';

export interface AiAssistantViewProps {
  projects?: Project[];
  initialProjectId?: string;
  recentReports?: AiReportRecord[];
  geminiConfigured?: boolean;
}

export function AiAssistantView({
  projects: propProjects,
  initialProjectId,
  recentReports: propReports,
  geminiConfigured = true,
}: AiAssistantViewProps) {
  const [projects, setProjects] = useState<Project[]>(() => {
    if (typeof window !== 'undefined') return getProjects();
    return propProjects || [];
  });
  const [recentReports, setRecentReports] = useState<AiReportRecord[]>(() => {
    if (typeof window !== 'undefined') return getAiReports();
    return propReports || [];
  });
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    if (initialProjectId) return initialProjectId;
    if (typeof window !== 'undefined') {
      const projs = getProjects();
      return projs[0]?.id || '';
    }
    return propProjects?.[0]?.id || '';
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AiAnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Selected actionable tasks to save to Feedback Board
  const [selectedTaskIds, setSelectedTaskIds] = useState<Record<string, boolean>>({});
  const [isSavingTasks, setIsSavingTasks] = useState(false);
  const [tasksSavedSuccess, setTasksSavedSuccess] = useState<string | null>(null);

  useEffect(() => {
    const handleStorageChange = () => {
      const loadedProjects = getProjects();
      const loadedReports = getAiReports();
      setProjects(loadedProjects);
      setRecentReports(loadedReports);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('dfh_storage_change', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dfh_storage_change', handleStorageChange);
    };
  }, []);

  const activeProject = projects.find((p) => p.id === selectedProjectId);

  const projectOptions = projects.map((p) => ({
    label: p.title,
    value: p.id,
  }));

  const handleAnalyze = async () => {
    if (!selectedProjectId) {
      setErrorMessage('Please select a project to analyze.');
      return;
    }

    const currentProject = projects.find((p) => p.id === selectedProjectId);
    if (!currentProject) {
      setErrorMessage('Project not found in storage.');
      return;
    }

    const feedbackItems = getFeedbackItems(selectedProjectId);
    if (feedbackItems.length === 0) {
      setErrorMessage(
        'This project has no feedback items yet. Add reviewer feedback on the Feedback Board before running Gemini AI analysis.'
      );
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysisResult(null);
    setTasksSavedSuccess(null);
    setSelectedTaskIds({});

    try {
      const response = await fetch('/api/ai/analyze-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: currentProject,
          feedbackItems,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete AI analysis.');
      }

      const result = data.result as AiAnalysisResult;
      setAnalysisResult(result);

      // Persist AI Report to Local Storage
      const session = getDemoSession();
      const userId = session?.user.id || DEFAULT_DEMO_USER.id;
      const saved = saveAiReport({
        project_id: selectedProjectId,
        user_id: userId,
        report_type: 'feedback_analysis',
        structured_result: result,
      });

      setRecentReports((prev) => [saved, ...prev]);

      // Pre-select all actionable tasks by default so user can review & uncheck
      const initialSelected: Record<string, boolean> = {};
      result.actionable_tasks?.forEach((t) => {
        initialSelected[t.id] = true;
      });
      setSelectedTaskIds(initialSelected);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis failed.';
      setErrorMessage(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = (text: string, sectionName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionName);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleSaveSelectedTasks = async () => {
    if (!analysisResult || !selectedProjectId) return;

    const tasksToSave = analysisResult.actionable_tasks.filter(
      (task) => selectedTaskIds[task.id]
    );

    if (tasksToSave.length === 0) {
      setErrorMessage('Please select at least one task to save to the Feedback Board.');
      return;
    }

    setIsSavingTasks(true);
    setErrorMessage(null);

    try {
      const session = getDemoSession();
      const userId = session?.user.id || DEFAULT_DEMO_USER.id;

      // Insert selected actionable tasks into Local Storage
      tasksToSave.forEach((task) => {
        createFeedbackItem({
          user_id: userId,
          project_id: selectedProjectId,
          title: task.title,
          comment: `[AI Generated Task from Feedback Analysis]\n${task.comment}`,
          reviewer_name: 'Gemini AI Assistant',
          category: task.category,
          priority: task.priority,
          status: task.suggested_status || 'To Do',
        });
      });

      setTasksSavedSuccess(
        `Successfully saved ${tasksToSave.length} tasks directly to your Feedback Board!`
      );
      // Deselect saved tasks to prevent accidental double submission
      setSelectedTaskIds({});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save tasks.';
      setErrorMessage(msg);
    } finally {
      setIsSavingTasks(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Intro Banner */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold border border-indigo-100">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Google Gemini 3.8 Flash Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
            AI Design Feedback Assistant
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
            Synthesize fragmented reviewer critiques into high-leverage design recommendations, spot recurring UX bottlenecks, and convert suggestions into tracked tasks.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-stone-400 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Server-only API key security & strict schema validation</span>
        </div>
      </div>

      {!geminiConfigured && (
        <Alert variant="warning" title="Gemini API Key Required">
          Please add <code className="bg-amber-100 font-mono px-1 py-0.5 rounded text-[11px]">GEMINI_API_KEY</code> from Google AI Studio to your <code className="bg-amber-100 font-mono px-1 py-0.5 rounded text-[11px]">.env.local</code> file to run live AI analysis.
        </Alert>
      )}

      {/* Control Card: Select Project & Trigger */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="w-full sm:max-w-md space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 tracking-tight block">
              Select Portfolio Project to Analyze
            </label>
            {projectOptions.length > 0 ? (
              <Select
                options={projectOptions}
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setAnalysisResult(null);
                  setErrorMessage(null);
                  setTasksSavedSuccess(null);
                }}
              />
            ) : (
              <p className="text-xs text-stone-500">
                No projects found. Please create a project first.
              </p>
            )}
          </div>

          <Button
            size="md"
            onClick={handleAnalyze}
            isLoading={isAnalyzing}
            disabled={isAnalyzing || !selectedProjectId || projects.length === 0}
            className="w-full sm:w-auto bg-stone-900 hover:bg-stone-800 text-stone-50"
          >
            <Sparkles className="w-4 h-4 mr-1.5 text-indigo-400" />
            <span>Analyze Feedback with Gemini</span>
          </Button>
        </div>

        {activeProject && (
          <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 flex-wrap gap-2">
            <span>
              Category: <strong className="text-stone-700">{activeProject.category}</strong> • Status:{' '}
              <strong className="text-stone-700">{activeProject.status}</strong>
            </span>
            <Link
              href={`/feedback?project=${activeProject.id}`}
              className="text-indigo-600 hover:underline inline-flex items-center gap-1 font-medium"
            >
              <KanbanSquare className="w-3.5 h-3.5" />
              <span>View this project&apos;s feedback items &rarr;</span>
            </Link>
          </div>
        )}
      </Card>

      {/* Error alert */}
      {errorMessage && (
        <Alert variant="error" title="Analysis Error">
          {errorMessage}
        </Alert>
      )}

      {/* Task Saved alert */}
      {tasksSavedSuccess && (
        <Alert variant="success" title="Feedback Board Updated">
          {tasksSavedSuccess}{' '}
          <Link href={`/feedback?project=${selectedProjectId}`} className="font-semibold underline ml-1">
            Open Feedback Board &rarr;
          </Link>
        </Alert>
      )}

      {/* Loading State Skeleton */}
      {isAnalyzing && (
        <Card className="p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 animate-bounce">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900">
              Gemini AI is analyzing reviewer critique...
            </h3>
            <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
              Synthesizing recurring usability issues, prioritizing design iterations, and generating concrete implementation tasks.
            </p>
          </div>
          <div className="w-48 h-1.5 bg-stone-100 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full animate-pulse w-3/4" />
          </div>
        </Card>
      )}

      {/* Render Analysis Results */}
      {analysisResult && !isAnalyzing && (
        <div className="space-y-8 animate-fade-in">
          {/* Section 1: Executive Summary */}
          <Card className="p-6">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Executive Feedback Synthesis</span>
                </CardTitle>
                <CardDescription>
                  High-level breakdown of reviewer observations and recurring sentiments.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  handleCopy(
                    analysisResult.summary.overall_summary,
                    'executive_summary'
                  )
                }
              >
                {copiedSection === 'executive_summary' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Copy Summary</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="p-4 bg-stone-50/80 rounded-xl border border-stone-200/60 text-xs sm:text-sm text-stone-800 leading-relaxed font-serif">
                &ldquo;{analysisResult.summary.overall_summary}&rdquo;
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Recurring Issues */}
                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
                    <Flame className="w-4 h-4 text-amber-600" />
                    <span>Recurring Design Issues</span>
                  </div>
                  <ul className="text-xs text-amber-800 space-y-1.5 list-disc list-inside">
                    {analysisResult.summary.recurring_issues.map((issue, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Positive Observations */}
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/60 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Validated Strengths</span>
                  </div>
                  <ul className="text-xs text-emerald-800 space-y-1.5 list-disc list-inside">
                    {analysisResult.summary.positive_observations.map((pos, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {pos}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Usability & Accessibility Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-100 space-y-1">
                  <span className="font-semibold text-stone-900 block">
                    Usability & Flow Concerns:
                  </span>
                  <ul className="text-stone-600 space-y-1 list-disc list-inside">
                    {analysisResult.summary.usability_concerns.map((u, idx) => (
                      <li key={idx}>{u}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-stone-50 rounded-lg border border-stone-100 space-y-1">
                  <span className="font-semibold text-stone-900 block">
                    Accessibility & Contrast Notes:
                  </span>
                  <ul className="text-stone-600 space-y-1 list-disc list-inside">
                    {analysisResult.summary.accessibility_concerns.map((a, idx) => (
                      <li key={idx}>{a}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Smart Recommendations */}
          <Card className="p-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-600" />
                <span>Strategic Design Recommendations ({analysisResult.recommendations.length})</span>
              </CardTitle>
              <CardDescription>
                Prioritized, high-impact refinements synthesized directly from review patterns.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 divide-y divide-stone-100">
              {analysisResult.recommendations.map((rec, idx) => (
                <div key={rec.id || idx} className="py-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <PriorityBadge priority={rec.suggested_priority} />
                        <span className="text-xs font-semibold text-stone-400">
                          Effort: {rec.estimated_effort}
                        </span>
                        <span className="text-xs font-semibold text-indigo-600">
                          Confidence: {rec.confidence}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-stone-900 pt-0.5">
                        {rec.title}
                      </h4>
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed">
                    {rec.explanation}
                  </p>

                  {/* Concrete Steps */}
                  <div className="p-3 bg-stone-50/80 rounded-lg border border-stone-100 space-y-1.5 text-xs">
                    <span className="font-semibold text-stone-800 block text-[11px] uppercase tracking-wider">
                      Recommended Steps:
                    </span>
                    <ol className="list-decimal list-inside space-y-1 text-stone-700">
                      {rec.concrete_steps.map((step, sIdx) => (
                        <li key={sIdx}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                    <span>
                      <strong>Expected Benefit:</strong> {rec.expected_benefit}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Section 3: Actionable Tasks to Feed Board */}
          <Card className="p-6">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-emerald-600" />
                  <span>Actionable Tasks for Feedback Board</span>
                </CardTitle>
                <CardDescription>
                  Select generated tasks to automatically push to your Feedback Board.
                </CardDescription>
              </div>

              <Button
                size="sm"
                variant="primary"
                onClick={handleSaveSelectedTasks}
                isLoading={isSavingTasks}
                disabled={isSavingTasks}
                className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <KanbanSquare className="w-3.5 h-3.5 mr-1.5" />
                <span>Push Selected to Feedback Board</span>
              </Button>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="divide-y divide-stone-100">
                {analysisResult.actionable_tasks.map((task) => (
                  <div
                    key={task.id}
                    className="py-3 flex items-start gap-3.5 hover:bg-stone-50/50 p-2 rounded-lg transition-colors cursor-pointer"
                    onClick={() => toggleTaskSelection(task.id)}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(selectedTaskIds[task.id])}
                      onChange={() => toggleTaskSelection(task.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 h-4 w-4 rounded border-stone-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-stone-900">
                          {task.title}
                        </span>
                        <div className="flex items-center gap-2">
                          <PriorityBadge priority={task.priority} />
                          <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                            {task.category}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        {task.comment}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Comprehensive Project Review & Roadmap */}
          <Card className="p-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>Showcase Readiness Roadmap</span>
              </CardTitle>
              <CardDescription>
                Strategic order of operations to elevate this portfolio piece to showcase quality.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-100 space-y-2">
                  <span className="font-semibold text-stone-900 uppercase tracking-wider text-[11px] block">
                    Strategic Design Shifts:
                  </span>
                  <ul className="space-y-1.5 list-disc list-inside text-stone-700">
                    {analysisResult.project_review.actionable_recommendations.map((ar, idx) => (
                      <li key={idx} className="leading-relaxed">{ar}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-stone-50 rounded-xl border border-stone-100 space-y-2">
                  <span className="font-semibold text-stone-900 uppercase tracking-wider text-[11px] block">
                    Recommended Order of Work:
                  </span>
                  <ol className="space-y-1.5 list-decimal list-inside text-stone-700">
                    {analysisResult.project_review.order_of_work.map((ow, idx) => (
                      <li key={idx} className="leading-relaxed">{ow}</li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-xs font-semibold text-stone-800 block mb-1.5">
                  Portfolio Showcase Roadmap:
                </span>
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-100 text-xs text-stone-700 leading-relaxed whitespace-pre-line">
                  {analysisResult.project_review.next_steps_plan}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Historical AI Reports for Reference */}
      {recentReports.length > 0 && (
        <Card className="p-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-stone-500" />
              <span>Historical Saved AI Reports</span>
            </CardTitle>
            <CardDescription>
              Previously generated Gemini analyses stored in local storage.
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
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-stone-400">
                    {formatDate(report.created_at)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={() => {
                      setAnalysisResult(report.structured_result);
                      setSelectedProjectId(report.project_id);
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                  >
                    View Report
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
