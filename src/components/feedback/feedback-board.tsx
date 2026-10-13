'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { FeedbackItem, FeedbackStatus, Project } from '@/types';
import { FeedbackModal } from './feedback-modal';
import { DeleteFeedbackDialog } from './delete-feedback-dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { PriorityBadge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';
import {
  KanbanSquare,
  Plus,
  Search,
  Sparkles,
  Edit2,
  Trash2,
  X,
  Clock,
  TrendingUp,
  CheckCircle2,
  FolderGit2,
} from 'lucide-react';

export interface FeedbackBoardProps {
  initialFeedback: FeedbackItem[];
  projects: Project[];
  selectedProjectId?: string;
}

export function FeedbackBoard({
  initialFeedback,
  projects,
  selectedProjectId: initialProjId,
}: FeedbackBoardProps) {
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>(initialFeedback);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjId || 'All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultStatus, setModalDefaultStatus] = useState<FeedbackStatus>('To Do');
  const [feedbackToEdit, setFeedbackToEdit] = useState<FeedbackItem | null>(null);
  const [feedbackToDelete, setFeedbackToDelete] = useState<FeedbackItem | null>(null);

  // Error banner for optimistic status update
  const [mutationError, setMutationError] = useState<string | null>(null);

  // Projects Map for fast lookup
  const projectsMap = useMemo(() => {
    const map: Record<string, Project> = {};
    projects.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [projects]);

  const projectOptions = [
    { label: 'All Projects', value: 'All' },
    ...projects.map((p) => ({ label: p.title, value: p.id })),
  ];

  const categories = [
    { label: 'All Categories', value: 'All' },
    { label: 'Visual Design', value: 'Visual Design' },
    { label: 'Usability', value: 'Usability' },
    { label: 'Accessibility', value: 'Accessibility' },
    { label: 'Typography', value: 'Typography' },
    { label: 'Color and Contrast', value: 'Color and Contrast' },
    { label: 'Navigation', value: 'Navigation' },
    { label: 'Responsiveness', value: 'Responsiveness' },
    { label: 'Performance', value: 'Performance' },
    { label: 'Other', value: 'Other' },
  ];

  const priorities = [
    { label: 'All Priorities', value: 'All' },
    { label: 'Critical', value: 'Critical' },
    { label: 'High', value: 'High' },
    { label: 'Medium', value: 'Medium' },
    { label: 'Low', value: 'Low' },
  ];

  // Filtering
  const filteredItems = useMemo(() => {
    return feedbackList.filter((fb) => {
      const matchesProject =
        selectedProjectId === 'All' || fb.project_id === selectedProjectId;
      const matchesCategory =
        selectedCategory === 'All' || fb.category === selectedCategory;
      const matchesPriority =
        selectedPriority === 'All' || fb.priority === selectedPriority;
      const matchesSearch =
        searchQuery.trim() === '' ||
        fb.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fb.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (fb.reviewer_name && fb.reviewer_name.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesProject && matchesCategory && matchesPriority && matchesSearch;
    });
  }, [feedbackList, selectedProjectId, selectedCategory, selectedPriority, searchQuery]);

  // Grouping into columns
  const todoItems = filteredItems.filter((i) => i.status === 'To Do');
  const inProgressItems = filteredItems.filter((i) => i.status === 'In Progress');
  const completedItems = filteredItems.filter((i) => i.status === 'Completed');

  const totalFiltered = filteredItems.length;
  const completionPercentage =
    totalFiltered > 0 ? Math.round((completedItems.length / totalFiltered) * 100) : 0;

  // Handle immediate status change with persistence
  const handleStatusChange = async (itemId: string, newStatus: FeedbackStatus) => {
    setMutationError(null);
    const previousItems = [...feedbackList];

    // Optimistic update
    setFeedbackList((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, status: newStatus } : item))
    );

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('You must be logged in to update feedback status.');
      }

      const { error } = await supabase
        .from('feedback')
        .update({ status: newStatus })
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }
    } catch (err: unknown) {
      // Revert optimistic update
      setFeedbackList(previousItems);
      const msg = err instanceof Error ? err.message : 'Failed to update status in database.';
      setMutationError(msg);
    }
  };

  const handleSavedFeedback = (savedItem: FeedbackItem) => {
    setFeedbackList((prev) => {
      const idx = prev.findIndex((i) => i.id === savedItem.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = savedItem;
        return updated;
      }
      return [savedItem, ...prev];
    });
  };

  const handleDeletedFeedback = (deletedId: string) => {
    setFeedbackList((prev) => prev.filter((i) => i.id !== deletedId));
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedProjectId !== 'All' ||
    selectedCategory !== 'All' ||
    selectedPriority !== 'All';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedProjectId('All');
    setSelectedCategory('All');
    setSelectedPriority('All');
  };

  return (
    <div className="space-y-6 pb-12">
      {mutationError && (
        <Alert variant="error" title="Database Update Failed">
          {mutationError}
        </Alert>
      )}

      {/* Progress & Overview Ribbon */}
      <div className="bg-white border border-stone-200/90 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <KanbanSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-stone-900">
                {selectedProjectId !== 'All' && projectsMap[selectedProjectId]
                  ? `${projectsMap[selectedProjectId].title} Board`
                  : 'Portfolio Feedback Board'}
              </h3>
              <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-medium">
                {totalFiltered} items
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {completedItems.length} of {totalFiltered} improvements completed ({completionPercentage}%)
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="flex-1 bg-stone-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-stone-700 shrink-0">
            {completionPercentage}%
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {selectedProjectId !== 'All' && (
            <Link href={`/ai-assistant?project=${selectedProjectId}`}>
              <Button variant="outline" size="sm" className="text-indigo-600 border-indigo-200 bg-indigo-50/40">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                <span>AI Review</span>
              </Button>
            </Link>
          )}
          <Button
            size="sm"
            onClick={() => {
              setFeedbackToEdit(null);
              setModalDefaultStatus('To Do');
              setIsModalOpen(true);
            }}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Add Feedback</span>
          </Button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-stone-200/80 shadow-2xs">
        {/* Project Selector */}
        <div className="w-48 sm:w-56">
          <Select
            options={projectOptions}
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          />
        </div>

        {/* Category */}
        <div className="w-40 sm:w-44">
          <Select
            options={categories}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          />
        </div>

        {/* Priority */}
        <div className="w-36 sm:w-40">
          <Select
            options={priorities}
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
          />
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
          <input
            type="text"
            placeholder="Search feedback..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-stone-500">
            Clear Filters
          </Button>
        )}
      </div>

      {/* Kanban Board Columns */}
      {projects.length === 0 ? (
        <Card className="py-16 text-center border-dashed">
          <FolderGit2 className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-stone-800">No Projects Found</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            You must create a portfolio project before you can log and organize feedback.
          </p>
          <div className="mt-5">
            <Link href="/projects">
              <Button size="sm">
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Create Your First Project</span>
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {/* Column 1: To Do */}
          <KanbanColumn
            title="To Do"
            items={todoItems}
            icon={Clock}
            colorClass="text-stone-600 bg-stone-100"
            borderClass="border-stone-200"
            projectsMap={projectsMap}
            onAddNew={() => {
              setFeedbackToEdit(null);
              setModalDefaultStatus('To Do');
              setIsModalOpen(true);
            }}
            onEdit={(item) => {
              setFeedbackToEdit(item);
              setIsModalOpen(true);
            }}
            onDelete={(item) => setFeedbackToDelete(item)}
            onStatusChange={handleStatusChange}
          />

          {/* Column 2: In Progress */}
          <KanbanColumn
            title="In Progress"
            items={inProgressItems}
            icon={TrendingUp}
            colorClass="text-indigo-600 bg-indigo-50"
            borderClass="border-indigo-100"
            projectsMap={projectsMap}
            onAddNew={() => {
              setFeedbackToEdit(null);
              setModalDefaultStatus('In Progress');
              setIsModalOpen(true);
            }}
            onEdit={(item) => {
              setFeedbackToEdit(item);
              setIsModalOpen(true);
            }}
            onDelete={(item) => setFeedbackToDelete(item)}
            onStatusChange={handleStatusChange}
          />

          {/* Column 3: Completed */}
          <KanbanColumn
            title="Completed"
            items={completedItems}
            icon={CheckCircle2}
            colorClass="text-emerald-600 bg-emerald-50"
            borderClass="border-emerald-100"
            projectsMap={projectsMap}
            onAddNew={() => {
              setFeedbackToEdit(null);
              setModalDefaultStatus('Completed');
              setIsModalOpen(true);
            }}
            onEdit={(item) => {
              setFeedbackToEdit(item);
              setIsModalOpen(true);
            }}
            onDelete={(item) => setFeedbackToDelete(item)}
            onStatusChange={handleStatusChange}
          />
        </div>
      )}

      {/* Add / Edit Modal */}
      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFeedbackToEdit(null);
        }}
        projects={projects}
        feedbackToEdit={feedbackToEdit}
        defaultProjectId={selectedProjectId !== 'All' ? selectedProjectId : projects[0]?.id}
        defaultStatus={modalDefaultStatus}
        onSuccess={handleSavedFeedback}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteFeedbackDialog
        isOpen={Boolean(feedbackToDelete)}
        item={feedbackToDelete}
        onClose={() => setFeedbackToDelete(null)}
        onDeleted={handleDeletedFeedback}
      />
    </div>
  );
}

// Kanban Column Component
interface KanbanColumnProps {
  title: string;
  items: FeedbackItem[];
  icon: React.ElementType;
  colorClass: string;
  borderClass: string;
  projectsMap: Record<string, Project>;
  onAddNew: () => void;
  onEdit: (item: FeedbackItem) => void;
  onDelete: (item: FeedbackItem) => void;
  onStatusChange: (itemId: string, newStatus: FeedbackStatus) => void;
}

function KanbanColumn({
  title,
  items,
  icon: Icon,
  colorClass,
  borderClass,
  projectsMap,
  onAddNew,
  onEdit,
  onDelete,
  onStatusChange,
}: KanbanColumnProps) {
  return (
    <div className={`bg-stone-100/60 rounded-xl p-3 border ${borderClass} flex flex-col min-h-[500px]`}>
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded-md ${colorClass}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs font-bold text-stone-900 tracking-tight">{title}</h4>
          <span className="text-[11px] font-semibold text-stone-500 bg-white px-2 py-0.5 rounded-full border border-stone-200 shadow-2xs">
            {items.length}
          </span>
        </div>
        <button
          onClick={onAddNew}
          title={`Add feedback to ${title}`}
          className="text-stone-400 hover:text-stone-800 p-1 rounded-md hover:bg-stone-200/60 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Items List */}
      <div className="space-y-2.5 flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="h-36 flex flex-col items-center justify-center text-center p-4 border border-dashed border-stone-300 rounded-lg bg-white/40">
            <span className="text-xs text-stone-400">No {title.toLowerCase()} tasks</span>
            <button
              onClick={onAddNew}
              className="mt-2 text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
            >
              + Add item
            </button>
          </div>
        ) : (
          items.map((item) => {
            const project = item.project || projectsMap[item.project_id];

            return (
              <div
                key={item.id}
                className="bg-white border border-stone-200/90 rounded-xl p-3.5 shadow-2xs hover:border-stone-300 hover:shadow-xs transition-all space-y-2.5"
              >
                {/* Project Tag & Priority */}
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded max-w-[140px] truncate">
                    {project?.title || 'Project'}
                  </span>
                  <PriorityBadge priority={item.priority} />
                </div>

                {/* Title */}
                <h5 className="text-xs font-bold text-stone-900 leading-snug">
                  {item.title}
                </h5>

                {/* Comment Preview */}
                <p className="text-[11px] text-stone-500 leading-relaxed line-clamp-3">
                  {item.comment}
                </p>

                {/* Category & Reviewer Meta */}
                <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1 border-t border-stone-100">
                  <span className="font-medium text-stone-500">{item.category}</span>
                  {item.reviewer_name && (
                    <span className="truncate max-w-[100px]">By {item.reviewer_name}</span>
                  )}
                </div>

                {/* Status Changer & Card Controls */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  {/* Status quick mover */}
                  <select
                    value={item.status}
                    onChange={(e) => onStatusChange(item.id, e.target.value as FeedbackStatus)}
                    aria-label="Change status"
                    className="text-[10px] font-semibold py-0.5 px-1.5 bg-stone-50 border border-stone-200 rounded text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    <option value="To Do">Move: To Do</option>
                    <option value="In Progress">Move: In Progress</option>
                    <option value="Completed">Move: Completed</option>
                  </select>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(item)}
                      title="Edit feedback"
                      className="text-stone-400 hover:text-stone-700 p-1 rounded hover:bg-stone-100 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onDelete(item)}
                      title="Delete feedback"
                      className="text-stone-400 hover:text-rose-600 p-1 rounded hover:bg-stone-100 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
