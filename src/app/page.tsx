import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Layers,
  Sparkles,
  KanbanSquare,
  BarChart3,
  ArrowRight,
  HardDrive,
  ShieldCheck,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col text-stone-900 selection:bg-indigo-100">
      {/* Navigation Header */}
      <header className="border-b border-stone-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center text-white shadow-xs">
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="font-bold text-sm tracking-tight text-stone-900">
              Design Feedback Hub
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm">
                <span>Open Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-200 bg-indigo-50/70 text-indigo-700 text-xs font-semibold tracking-tight mb-6 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>AI-Powered Portfolio Critique & Workflow</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-stone-900 leading-tight mb-6">
          Turn scattered feedback into an{' '}
          <span className="text-indigo-600 underline decoration-indigo-200 decoration-wavy underline-offset-8">
            irresistible
          </span>{' '}
          design portfolio.
        </h1>

        <p className="text-base sm:text-lg text-stone-600 max-w-2xl mb-10 leading-relaxed font-normal">
          Organize reviewer critiques, track design improvements in an intuitive Kanban board, and leverage Google Gemini to uncover recurring UX blindspots.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full justify-center mb-16">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto px-8 shadow-sm">
              <span>Explore Demo Workspace</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
              Sign In (Demo Mode)
            </Button>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full mt-4">
          <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <KanbanSquare className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-stone-900">
              Structured Kanban Board
            </h2>
            <p className="text-xs text-stone-500 leading-relaxed">
              Track improvements across To Do, In Progress, and Completed. Filter by project, priority, and category.
            </p>
          </div>

          <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-stone-900">
              Gemini 3.8 AI Assistant
            </h2>
            <p className="text-xs text-stone-500 leading-relaxed">
              Synthesize reviewer feedback, spot recurring design issues, and convert suggestions into actionable tasks with one click.
            </p>
          </div>

          <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-stone-900">
              Audit & CSV Export
            </h2>
            <p className="text-xs text-stone-500 leading-relaxed">
              Measure completion percentages, analyze feedback distributions, and export sanitised CSV reports for workshop reviews.
            </p>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-stone-200/60 w-full flex flex-wrap items-center justify-center gap-8 text-xs text-stone-500">
          <span className="flex items-center gap-1.5">
            <HardDrive className="w-4 h-4 text-emerald-600" />
            Browser Local Storage Persistence
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Privacy-First Demo Architecture
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Google Gen AI Official SDK
          </span>
        </div>
      </main>

      <footer className="border-t border-stone-200/80 bg-white py-6 text-center text-xs text-stone-400">
        Design Feedback Hub &copy; {new Date().getFullYear()} — Built for Workshop Submission & Designer Showcases.
      </footer>
    </div>
  );
}
