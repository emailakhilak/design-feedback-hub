# Design Feedback Hub (Design Portfolio Feedback Board)

A modern, fast, AI-powered portfolio feedback management platform designed for UI/UX designers, developers, students, and creators. Built for workshop presentations, portfolio reviews, and rapid design critique tracking.

---

## 1. Project Overview

Students and designers regularly receive feedback across fragmented channels: Slack, WhatsApp, email threads, Figma comments, and verbal crits. This leads to lost feedback, unclear priorities, and difficulty tracking improvements.

**Design Feedback Hub** centralizes portfolio critiques into an intuitive, zero-setup workflow:
1. **Portfolio Projects**: Create and manage design case studies with metadata, categories, live previews, and Figma links.
2. **Interactive Kanban Board**: Organize reviewer feedback into *To Do*, *In Progress*, and *Completed* columns with immediate status updates and priority badges.
3. **Google Gemini 3.8 AI Assistant**: Analyze reviewer critiques using Google's official `@google/genai` SDK (`gemini-3.8-flash`) to generate executive summaries, detect recurring bottlenecks, provide smart architectural recommendations, and convert critiques into actionable tasks with one-click saving.
4. **Audit Reports & CSV Export**: Track iteration completion rates and export spreadsheet-ready CSV logs secured with **CSV formula-injection protection** (`=`, `+`, `-`, `@`, `\t`, `\r` escaped).
5. **Zero-Database Persistence (Local Storage)**: All projects, feedback items, Kanban statuses, AI reports, and profiles persist reliably directly inside the user's browser via Local Storage.

---

## 2. Key Features

- **Browser Local Storage Persistence**: Complete client-side storage layer persisting projects, feedback, AI reports, and settings across browser refreshes with automatic cascading deletion and corrupted-data self-healing.
- **Local-Demo Authentication Flow**: Zero-configuration demo authentication designed for workshop presentations. Features 1-click access with pre-configured demo personas without storing passwords or making false security claims.
- **Google Gemini 3.8 Flash AI Engine**: Server-side API integration calling Google's multimodal reasoning model (`gemini-3.8-flash`) via the official `@google/genai` SDK. The API key remains strictly server-side and is never exposed to the client.
- **Selective AI Task Conversion**: Review AI suggestions and selectively check items to batch-insert them into the Feedback Board.
- **Interactive Kanban Board**: Live column counts, inline status changer, multi-dimensional filtering (by project, category, priority), real-time search, and instant reset.
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
     Client Local Storage Layer    Server Route (/api/ai)
  (dfh_projects, dfh_feedback,           │
   dfh_ai_reports, dfh_profile)   Google Gen AI SDK (@google/genai)
                │                        │
       Browser Local Storage      Google Gemini 3.8 Flash
     (Instant CRUD & Cascade)            │
                                  JSON Schema Validation (Zod)
```

- **Frontend & App Shell**: Next.js App Router (React 19, TypeScript strict mode, Tailwind CSS).
- **Persistence Layer**: Custom, robust browser Local Storage engine (`src/lib/storage/index.ts`) handling CRUD operations, UUID generation, relation cascade deletions, and custom change events (`dfh_storage_change`).
- **Demo Authentication**: Local demo session manager (`dfh_demo_session`) protecting casual navigation routes while clearly communicating that it is for demonstration purposes.
- **AI Backend**: Server-only API route `POST /api/ai/analyze-feedback` reading `GEMINI_API_KEY` from `process.env`. Project data is passed safely from the client storage layer, validated via Zod, and passed to Gemini.

---

## 4. Local Storage & Demo Auth Considerations

### Local Storage Characteristics & Limits
- **Browser-Specific**: Application data is saved inside your local web browser (`localStorage`). Data does not sync across different browsers or separate devices.
- **Data Retention & Clearing**: If you clear browser website data, cookies, or use an Incognito/Private browsing window, stored data may be reset.
- **Resetting Demo Data**: You can restore the comprehensive default seed data at any time by navigating to **Settings -> Reset to Demo Data**.

### Demo Authentication Security Notice
- **Demo-Only Purpose**: The login and signup screens provide a streamlined, zero-friction experience for evaluators, workshop facilitators, and reviewers.
- **No Password Storage**: Passwords are intentionally **never** stored in Local Storage.
- **Not for Production Multi-Tenancy**: Client-side storage cannot provide real multi-user tenant isolation. Do not enter confidential or proprietary credentials.

---

## 5. Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router & Turbopack)
- **UI & Components**: React 19, Tailwind CSS, [Lucide React](https://lucide.dev/)
- **Language**: TypeScript (strict type checking enabled)
- **Persistence**: Browser Local Storage (Zero external database required)
- **AI Integration**: [Google Gen AI SDK](https://www.npmjs.com/package/@google/genai) (`@google/genai` with `gemini-3.8-flash`)
- **Validation**: [Zod](https://zod.dev/)
- **Testing**: [Vitest](https://vitest.dev/)
- **Deployment**: [Vercel](https://vercel.com/)

---

## 6. Windows Setup & Installation

Follow these exact steps to set up and run the application on Windows using PowerShell or Command Prompt.

### Step 1: Verify Prerequisites
Ensure Node.js and npm are installed:
```powershell
node -v    # Recommended: v20.x or v24.x
npm -v     # Recommended: v10.x or v11.x
```

### Step 2: Clone or Open the Project
Open PowerShell and navigate to your project directory:
```powershell
cd c:\PROJECTS\Antigravity\portfolio
```

### Step 3: Install Dependencies
```powershell
npm install
```

### Step 4: Configure Environment Variables
Copy `.env.example` to create your `.env.local`:
```powershell
Copy-Item .env.example .env.local
```
*(Or use `copy .env.example .env.local` in cmd.exe)*

Open `.env.local` in your editor and optionally configure your Google Gemini API Key:
```env
# Google Gemini API Key (Server-Side ONLY)
# Obtain from Google AI Studio (https://aistudio.google.com/)
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Optional: Override Gemini Model (defaults to gemini-3.8-flash)
GEMINI_MODEL=gemini-3.8-flash
```

> **Note**: If `GEMINI_API_KEY` is not provided, the rest of the application (Dashboard, Projects, Kanban Feedback Board, Reports, Settings, CSV export) functions completely without error. The AI Assistant page will display a clear setup banner explaining how to configure your key.

### Step 5: Start Development Server
```powershell
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 7. Google Gemini API Setup

1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Click **Get API key** and create a new Gemini API Key.
3. Add the key to `.env.local`:
   ```env
   GEMINI_API_KEY=AIzaSy...
   ```
4. Restart your development server (`npm run dev`).
5. **Security**: The Gemini API key is strictly maintained on the server within `/api/ai/analyze-feedback`. It is never prefixed with `NEXT_PUBLIC_` and is never exposed in browser Local Storage.

---

## 8. Verification & Testing

### Automated Test Suite
Run the 28 unit tests covering Local Storage operations, UUID generation, cascade deletion, corrupted data recovery, validation schemas, and CSV sanitization:
```powershell
npm test
```

### Type Checking
Run the TypeScript compiler with zero emit:
```powershell
npx tsc --noEmit
```

### Code Linting
Run ESLint:
```powershell
npm run lint
```

### Production Build
Build the optimized production application:
```powershell
npm run build
```

Run the production server locally:
```powershell
npm run start
```

---

## 9. Vercel Deployment Instructions

1. Push your repository to GitHub.
2. Sign in to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your `design-feedback-hub` repository.
4. Under **Environment Variables**, set:
   - `GEMINI_API_KEY` = *your Google Gemini API Key*
5. Click **Deploy**. Vercel will compile the Next.js application into a globally distributed edge bundle. No database provisioning is required!

---

## 10. Submission Checklist

- [x] Zero Supabase dependencies, imports, or database credentials
- [x] Pure browser Local Storage persistence with auto-seeding
- [x] Full CRUD operations for Projects and Feedback
- [x] Kanban status tracking (*To Do*, *In Progress*, *Completed*)
- [x] Cascade deletion of feedback items when a project is deleted
- [x] Graceful recovery and fallback from corrupted Local Storage data
- [x] Safe local-demo authentication flow (no passwords stored)
- [x] Server-side Google Gemini 3.8 Flash AI integration with `@google/genai`
- [x] CSV export with formula injection defense
- [x] 100% passing automated tests (Vitest)
- [x] Zero TypeScript errors (`npx tsc --noEmit`)
- [x] Zero ESLint warnings or errors (`npm run lint`)
- [x] Successful production build (`npm run build`)
