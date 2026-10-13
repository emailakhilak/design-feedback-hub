'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Project } from '@/types';
import { ProjectModal } from './project-modal';
import { DeleteProjectDialog } from './delete-project-dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import {
  FolderGit2,
  Plus,
  Search,
  ExternalLink,
  KanbanSquare,
  Sparkles,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';

export interface ProjectsViewProps {
  initialProjects: Project[];
}

export function ProjectsView({ initialProjects }: ProjectsViewProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const categories = [
    { label: 'All Categories', value: 'All' },
    { label: 'UI/UX Design', value: 'UI/UX Design' },
    { label: 'Web Design', value: 'Web Design' },
    { label: 'Mobile App', value: 'Mobile App' },
    { label: 'Branding', value: 'Branding' },
    { label: 'Graphic Design', value: 'Graphic Design' },
    { label: 'Other', value: 'Other' },
  ];

  const statuses = [
    { label: 'All Statuses', value: 'All' },
    { label: 'Draft', value: 'Draft' },
    { label: 'In Review', value: 'In Review' },
    { label: 'Improving', value: 'Improving' },
    { label: 'Completed', value: 'Completed' },
  ];

  const sortOptions = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Oldest First', value: 'oldest' },
    { label: 'Title (A-Z)', value: 'title-asc' },
    { label: 'Title (Z-A)', value: 'title-desc' },
  ];

  // Filtering & Sorting
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        const matchesSearch =
          searchQuery.trim() === '' ||
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory =
          selectedCategory === 'All' || p.category === selectedCategory;

        const matchesStatus =
          selectedStatus === 'All' || p.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        if (sortBy === 'title-asc') {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === 'title-desc') {
          return b.title.localeCompare(a.title);
        }
        return 0;
      });
  }, [projects, searchQuery, selectedCategory, selectedStatus, sortBy]);

  const handleSavedProject = (saved: Project) => {
    setProjects((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [saved, ...prev];
    });
  };

  const handleDeletedProject = (deletedId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== deletedId));
  };

  const hasActiveFilters =
    searchQuery !== '' || selectedCategory !== 'All' || selectedStatus !== 'All';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedStatus('All');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search projects by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Create Action */}
        <Button
          size="sm"
          onClick={() => {
            setProjectToEdit(null);
            setIsModalOpen(true);
          }}
          className="shrink-0 shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          <span>New Project</span>
        </Button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-stone-200/80 shadow-2xs">
        <div className="w-40 sm:w-48">
          <Select
            options={categories}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          />
        </div>

        <div className="w-36 sm:w-40">
          <Select
            options={statuses}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          />
        </div>

        <div className="w-36 sm:w-44 ml-auto">
          <Select
            options={sortOptions}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          />
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-stone-500 hover:text-stone-900">
            Clear Filters
          </Button>
        )}
      </div>

      {/* Project Grid */}
      {filteredProjects.length === 0 ? (
        <Card className="py-16 text-center border-dashed">
          <FolderGit2 className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-stone-800">
            {hasActiveFilters ? 'No projects match your active filters' : 'No portfolio projects yet'}
          </h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'Try modifying your search query or reset your category and status filters.'
              : 'Add your first design portfolio project to start collecting reviewer feedback and running AI critiques.'}
          </p>
          <div className="mt-5">
            {hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Reset Filters
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  setProjectToEdit(null);
                  setIsModalOpen(true);
                }}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                <span>Create First Project</span>
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="flex flex-col justify-between hover:border-stone-300 hover:shadow-xs transition-all group"
            >
              <div>
                {/* Image Cover (if provided) */}
                {project.preview_image_url && (
                  <div className="h-36 -mx-5 -mt-5 mb-4 rounded-t-xl overflow-hidden bg-stone-100 border-b border-stone-100 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={project.preview_image_url}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      onError={(e) => {
                        // Gracefully hide broken image container
                        (e.target as HTMLElement).parentElement?.classList.add('hidden');
                      }}
                    />
                  </div>
                )}

                {/* Metadata & Status */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                    {project.category}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                    {project.status}
                  </span>
                </div>

                {/* Title */}
                <Link href={`/projects/${project.id}`}>
                  <h3 className="text-base font-semibold text-stone-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {project.title}
                  </h3>
                </Link>

                {/* Description */}
                <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                  {project.description}
                </p>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Link href={`/feedback?project=${project.id}`}>
                    <Button variant="outline" size="sm" className="text-xs h-7.5 px-2.5">
                      <KanbanSquare className="w-3 h-3 text-emerald-600 mr-1" />
                      <span>Board</span>
                    </Button>
                  </Link>

                  <Link href={`/ai-assistant?project=${project.id}`}>
                    <Button variant="outline" size="sm" className="text-xs h-7.5 px-2.5 text-indigo-600 border-indigo-200 bg-indigo-50/30">
                      <Sparkles className="w-3 h-3 text-indigo-600 mr-1" />
                      <span>AI Audit</span>
                    </Button>
                  </Link>

                  {project.project_url && (
                    <a
                      href={project.project_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-stone-400 hover:text-stone-700 p-1.5 rounded-md hover:bg-stone-50 transition-colors"
                      title="Open External URL"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setProjectToEdit(project);
                      setIsModalOpen(true);
                    }}
                    title="Edit project"
                    className="text-stone-400 hover:text-stone-700 p-1.5 rounded-md hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setProjectToDelete(project)}
                    title="Delete project"
                    className="text-stone-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setProjectToEdit(null);
        }}
        projectToEdit={projectToEdit}
        onSuccess={handleSavedProject}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteProjectDialog
        isOpen={Boolean(projectToDelete)}
        project={projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onDeleted={handleDeletedProject}
      />
    </div>
  );
}
