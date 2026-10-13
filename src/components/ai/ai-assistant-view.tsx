'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Project, AiAnalysisResult, AiReportRecord } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { PriorityBadge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import {
  Sparkles,
  Bot,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  ShieldCheck,
  Layers,
  ListTodo,
  KanbanSquare,
  History,
} from 'lucide-react';

export interface AiAssistantViewProps {
  projects: Project[];
  initialProjectId?: string;
  recentReports: AiReportRecord[];
  geminiConfigured: boolean;
}

export function AiAssistantView({
  projects,
  initialProjectId,
  recentReports,
  geminiConfigured,
}: AiAssistantViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialProjectId || projects[0]?.id || ''
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AiAnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Selected actionable tasks to save to Feedback Board
  const [selectedTaskIds, setSelectedTaskIds] = useState<Record<string, boolean>>({});
  const [isSavingTasks, setIsSavingTasks] = useState(false);
  const [tasksSavedSuccess, setTasksSavedSuccess] = useState<string | null>(null);

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

    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysisResult(null);
    setTasksSavedSuccess(null);
    setSelectedTaskIds({});

    try {
      const response = await fetch('/api/ai/analyze-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProjectId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete AI analysis.');
      }

      setAnalysisResult(data.result as AiAnalysisResult);

      // Pre-select all actionable tasks by default so user can review & uncheck
      const initialSelected: Record<string, boolean> = {};
      (data.result as AiAnalysisResult).actionable_tasks?.forEach((t) => {
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
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Authentication expired. Please log in.');
      }

      // Batch insert selected actionable tasks into the feedback table
      const rowsToInsert = tasksToSave.map((task) => ({
        user_id: user.id,
        project_id: selectedProjectId,
        title: task.title,
        comment: `[AI Generated Task from Feedback Analysis]\n${task.comment}`,
        reviewer_name: 'Gemini AI Assistant',
        category: task.category,
        priority: task.priority,
        status: task.suggested_status || 'To Do',
      }));

      const { error } = await supabase.from('feedback').insert(rowsToInsert);

      if (error) {
        throw error;
      }

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

      {/* Error Banner */}
      {errorMessage && (
        <Alert variant="error" title="Analysis Error">
          {errorMessage}
        </Alert>
      )}

      {/* Success Banner for Saved Tasks */}
      {tasksSavedSuccess && (
        <Alert variant="success" title="Tasks Created on Feedback Board">
          {tasksSavedSuccess}{' '}
          <Link
            href={`/feedback?project=${selectedProjectId}`}
            className="underline font-semibold ml-1"
          >
            Open Feedback Board
          </Link>
        </Alert>
      )}

      {/* Analysis Output Container */}
      {analysisResult && (
        <div className="space-y-8 animate-fade-in">
          {/* AI Disclaimer Notice */}
          <div className="flex items-center justify-between p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-950">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-600" />
              <span>
                <strong>Gemini AI Synthesis:</strong> Recommendations and tasks are synthesized from actual reviewer notes. Review before applying.
              </span>
            </div>
            <button
              onClick={() =>
                handleCopy(JSON.stringify(analysisResult, null, 2), 'full_json')
              }
              className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
            >
              {copiedSection === 'full_json' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>Copy Full Report</span>
            </button>
          </div>

          {/* SECTION A: Summary & Recurring Issues */}
          <Card className="p-6">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Flame className="w-4 h-4 text-indigo-600" />
                  <span>Executive Feedback Summary & Recurring Issues</span>
                </CardTitle>
                <CardDescription>
                  Synthesized overview of common reviewer sentiments and recurring pain points.
                </CardDescription>
              </div>
              <button
                onClick={() =>
                  handleCopy(
                    `${analysisResult.summary.overall_summary}\n\nRecurring Issues:\n${analysisResult.summary.recurring_issues.join('\n')}`,
                    'summary'
                  )
                }
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded"
                title="Copy Summary"
              >
                {copiedSection === 'summary' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </CardHeader>

            <CardContent className="space-y-5 pt-2">
              {/* Overall Summary Paragraph */}
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-100 text-xs sm:text-sm text-stone-700 leading-relaxed font-normal">
                {analysisResult.summary.overall_summary}
              </div>

              {/* Recurring Issues & Positive Observations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/40 space-y-2">
                  <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wide flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    Recurring Design Bottlenecks
                  </h4>
                  <ul className="text-xs text-stone-700 space-y-1.5 list-disc list-inside">
                    {analysisResult.summary.recurring_issues.map((issue, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Positive Observations
                  </h4>
                  <ul className="text-xs text-stone-700 space-y-1.5 list-disc list-inside">
                    {analysisResult.summary.positive_observations.map((pos, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {pos}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Usability & Accessibility concerns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysisResult.summary.usability_concerns.length > 0 && (
                  <div className="p-3.5 rounded-xl border border-stone-200 bg-white space-y-1.5">
                    <h5 className="text-[11px] font-bold text-stone-900 uppercase tracking-wider">
                      Usability Concerns
                    </h5>
                    <ul className="text-xs text-stone-600 space-y-1 list-disc list-inside">
                      {analysisResult.summary.usability_concerns.map((u, i) => (
                        <li key={i}>{u}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.summary.accessibility_concerns.length > 0 && (
                  <div className="p-3.5 rounded-xl border border-stone-200 bg-white space-y-1.5">
                    <h5 className="text-[11px] font-bold text-stone-900 uppercase tracking-wider">
                      Accessibility & Contrast Concerns
                    </h5>
                    <ul className="text-xs text-stone-600 space-y-1 list-disc list-inside">
                      {analysisResult.summary.accessibility_concerns.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* SECTION B: Smart Recommendations */}
          <Card className="p-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Smart Architectural Recommendations</span>
              </CardTitle>
              <CardDescription>
                High-leverage design interventions with concrete steps and expected benefits.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysisResult.recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-4 rounded-xl border border-stone-200 bg-white space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <PriorityBadge priority={rec.suggested_priority} />
                        <span className="text-[10px] text-stone-500 font-medium px-2 py-0.5 bg-stone-100 rounded">
                          Effort: {rec.estimated_effort}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-stone-900">
                        {rec.title}
                      </h4>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        {rec.explanation}
                      </p>

                      {/* Concrete steps */}
                      <div className="pt-2">
                        <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block mb-1">
                          Implementation Steps:
                        </span>
                        <ul className="text-[11px] text-stone-600 space-y-1 list-decimal list-inside pl-1">
                          {rec.concrete_steps.map((step, sIdx) => (
                            <li key={sIdx}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100 text-[11px] text-indigo-700 bg-indigo-50/50 p-2 rounded-lg">
                      <strong>Expected Benefit:</strong> {rec.expected_benefit}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SECTION C: Actionable Tasks (Convert & Selectively Save) */}
          <Card className="p-6 border-indigo-200/80 bg-gradient-to-b from-indigo-50/20 to-white">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-indigo-600" />
                  <span>Convert Feedback into Actionable Tasks</span>
                </CardTitle>
                <CardDescription>
                  Review the tasks below, select which ones you want to tackle, and save them directly to your Feedback Board.
                </CardDescription>
              </div>

              <Button
                size="sm"
                onClick={handleSaveSelectedTasks}
                isLoading={isSavingTasks}
                disabled={isSavingTasks}
                className="shrink-0"
              >
                <span>Save Selected to Feedback Board</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-3 pt-2">
              <div className="space-y-2">
                {analysisResult.actionable_tasks.map((task) => {
                  const isChecked = Boolean(selectedTaskIds[task.id]);

                  return (
                    <div
                      key={task.id}
                      onClick={() => toggleTaskSelection(task.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                        isChecked
                          ? 'bg-indigo-50/40 border-indigo-200 shadow-2xs'
                          : 'bg-white border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleTaskSelection(task.id)}
                        className="mt-1 h-4 w-4 rounded border-stone-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs font-bold text-stone-900">
                            {task.title}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-medium">
                              {task.category}
                            </span>
                            <PriorityBadge priority={task.priority} />
                          </div>
                        </div>
                        <p className="text-xs text-stone-600 leading-relaxed">
                          {task.comment}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* SECTION D: Project Review & Order of Work */}
          <Card className="p-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-stone-700" />
                <span>Overall Project Review & Sequenced Order of Work</span>
              </CardTitle>
              <CardDescription>
                Strategic review and recommended order of improvements to prepare for portfolio review.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                    Suggested Order of Work
                  </h4>
                  <div className="space-y-2">
                    {analysisResult.project_review.order_of_work.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border border-stone-100 bg-stone-50/70 text-xs flex items-start gap-2.5"
                      >
                        <span className="w-5 h-5 rounded-full bg-stone-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-stone-700">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                    Next-Steps Showcase Roadmap
                  </h4>
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-100 text-xs text-stone-700 leading-relaxed whitespace-pre-line">
                    {analysisResult.project_review.next_steps_plan}
                  </div>
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
              Previously generated Gemini analyses stored in Supabase.
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
