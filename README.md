# Design Feedback Hub (Design Portfolio Feedback Board)

A modern, full-stack, AI-powered portfolio feedback management platform designed for UI/UX designers, developers, students, and creators. Built for workshop presentation and the public project showcase.

---

## 1. Project Overview

Students and designers regularly receive feedback across fragmented channels: Slack, WhatsApp, email threads, Figma comments, and verbal crits. This leads to lost feedback, unclear priorities, and difficulty tracking improvements.

**Design Feedback Hub** centralizes portfolio critiques into an intuitive workflow:
1. **Portfolio Projects**: Create and manage design case studies with metadata, categories, live previews, and Figma links.
2. **Interactive Kanban Board**: Organize reviewer feedback into *To Do*, *In Progress*, and *Completed* columns with immediate status updates and priority badges.
3. **Google Gemini 3.8 AI Assistant**: Analyze reviewer critiques using the official `@google/genai` SDK to generate executive summaries, detect recurring bottlenecks, generate smart architectural recommendations, and convert critiques into actionable tasks with one-click saving.
4. **Audit Reports & CSV Export**: Track iteration completion rates and export spreadsheet-ready CSV logs secured with **CSV formula-injection protection** (`=`, `+`, `-`, `@`, `\t`, `\r` escaped).

---

## 2. Key Features

- **Full-Stack Persistence**: Real PostgreSQL database with Supabase Authentication and tenant-isolated Row-Level Security (RLS).
- **Google Gemini 3.8 Flash AI Engine**: Server-side API integration calling Google's latest multimodal reasoning model (`gemini-3.8-flash`) via the official `@google/genai` SDK.
- **Selective AI Task Conversion**: Review AI suggestions and selectively check items to batch-insert them into the Feedback Board.
- **Interactive Kanban Board**: Column counts, inline status changer, multi-dimensional filtering (by project, category, priority), search, and clear filters.
- **Security-First Reporting**: Automated formula injection sanitization guaranteeing safety when opening exports in Microsoft Excel or Google Sheets.
- **Responsive Editorial Design**: Minimalist, high-contrast creative SaaS interface optimized for desktop, tablet, and mobile with visible keyboard focus and ARIA accessibility.

---

## 3. Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Next.js 16 (App Router)             │
│   /dashboard   /projects   /feedback   /ai-assistant   │
│                 /reports    /settings                  │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
       Supabase SSR Auth        Server Route (/api/ai)
     (Cookies & Middleware)              │
                │               Google Gen AI SDK (@google/genai)
                │                        │
        PostgreSQL + RLS         Google Gemini 3.8 Flash
     (profiles, projects,                │
     feedback, ai_reports)      JSON Schema Validation (Zod)
```

- **Frontend & App Shell**: Next.js App Router (React 19, TypeScript strict mode, Tailwind CSS).
- **Authentication**: Supabase SSR Auth with cookie-based session refreshment and server-side route guards.
- **Database & Row Level Security**: Supabase PostgreSQL with cascading foreign keys and RLS policies ensuring users only read and mutate their own data.
- **AI Backend**: Server-only API route `POST /api/ai/analyze-feedback` verifying user authentication and project ownership before querying Gemini.

---

## 4. Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI & Components**: React 19, Tailwind CSS, [Lucide React](https://lucide.dev/)
- **Language**: TypeScript (strict type checking enabled)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + RLS + Auth)
- **AI Integration**: [Google Gen AI SDK](https://www.npmjs.com/package/@google/genai) (`@google/genai` with `gemini-3.8-flash`)
- **Validation**: [Zod](https://zod.dev/)
- **Testing**: [Vitest](https://vitest.dev/)
- **Deployment**: [Vercel](https://vercel.com/)

---

## 5. Prerequisites

- **Node.js**: v20+ or v24+
- **npm**: v10+ or v11+
- **Supabase Account**: (Free tier at [supabase.com](https://supabase.com/))
- **Google AI Studio Account**: (Free API key at [aistudio.google.com](https://aistudio.google.com/))

---

## 6. Installation & Local Setup

### Step 1: Clone the repository
```bash
git clone https://github.com/your-username/design-feedback-hub.git
cd design-feedback-hub
```

### Step 2: Install dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your credentials:
```env
# Supabase Project URL & Anon Key (From Supabase Project Settings -> API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Gemini API Key (From Google AI Studio)
GEMINI_API_KEY=AIzaSy...

# Optional: Gemini Model override
GEMINI_MODEL=gemini-3.8-flash
```

---

## 7. Supabase Database Migration Setup

1. Log into your [Supabase Dashboard](https://supabase.com/dashboard) and create a new project.
2. Navigate to the **SQL Editor** tab on the left sidebar.
3. Open the migration file in this repository:
   `supabase/migrations/20261013000001_initial_schema.sql`
4. Copy the entire contents of the file and paste it into the Supabase SQL Editor.
5. Click **Run**.
6. This executes:
   - Tables: `profiles`, `projects`, `feedback`, `ai_reports`
   - Automated `updated_at` trigger functions
   - Automated user profile creation trigger (`handle_new_user`)
   - Strict Row Level Security (RLS) policies for tenant isolation
   - Performance indexes on `user_id`, `project_id`, `status`, and `priority`

---

## 8. Google Gemini API Setup

1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Click **Get API key** and generate a new Gemini API Key.
3. Copy the key into `.env.local` under `GEMINI_API_KEY`.
4. The application communicates with model `gemini-3.8-flash` via the official `@google/genai` TypeScript SDK. The key remains 100% server-side and is never sent to the browser.

---

## 9. Local Development Commands

Start the local development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 10. Automated Testing

Run the Vitest test suite covering validation schemas, dashboard metrics calculations, CSV formula injection defense, and AI output schemas:
```bash
npm test
```

Run test suite in watch mode:
```bash
npm run test:watch
```

---

## 11. Linting & Type Validation

Run TypeScript validation:
```bash
npx tsc --noEmit
```

Run ESLint:
```bash
npm run lint
```

---

## 12. Production Build

Create an optimized production bundle:
```bash
npm run build
```

Run the production server locally:
```bash
npm run start
```

---

## 13. GitHub Publishing Instructions

1. Initialize git and commit your files:
   ```bash
   git add .
   git commit -m "feat: complete Design Feedback Hub application"
   ```
2. Create a new GitHub repository (e.g. `design-feedback-hub`) via the GitHub web UI or GitHub CLI:
   ```bash
   gh repo create design-feedback-hub --public --source=. --remote=origin --push
   ```
   Or using standard git remote:
   ```bash
   git remote add origin https://github.com/your-username/design-feedback-hub.git
   git branch -M main
   git push -u origin main
   ```

---

## 14. Vercel Deployment Instructions

1. Push your repository to GitHub.
2. Sign in to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your `design-feedback-hub` repository.
4. In the **Environment Variables** section, add the 3 variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
5. Click **Deploy**.
6. Vercel automatically runs `npm run build` and provisions the global serverless edge deployment.

---

## 15. Known Limitations & Safe Offline Mode

- **Zero-Crash Setup Experience**: If Supabase or Gemini credentials are not yet configured in `.env.local`, the application does not crash. It displays informative configuration banners on the Dashboard, Login, and Settings pages, with clear steps for setting up accounts.
- **Mock / Offline Fallback**: Unit tests mock external Supabase and Gemini endpoints, enabling automated CI/CD pipelines to validate 100% of the code without requiring live network access during test runs.

---

## 16. Workshop Project Wall Submission Checklist

- [x] Full-stack Next.js App Router application
- [x] Real PostgreSQL schema with Supabase migrations
- [x] Complete Row Level Security tenant isolation
- [x] Real Google Gemini 3.8 Flash AI integration using official `@google/genai` SDK
- [x] CSV export with formula injection defense
- [x] 100% passing automated tests (Vitest)
- [x] Production build verified with zero errors or warnings
