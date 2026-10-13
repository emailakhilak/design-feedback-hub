-- ==============================================================================
-- DESIGN FEEDBACK HUB (Design Portfolio Feedback Board)
-- Migration: 20261013000001_initial_schema.sql
-- Tables: profiles, projects, feedback, ai_reports
-- Row Level Security (RLS) & Triggers
-- ==============================================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL DEFAULT '',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    detailed_description TEXT,
    category TEXT NOT NULL CHECK (category IN (
        'UI/UX Design',
        'Web Design',
        'Mobile App',
        'Branding',
        'Graphic Design',
        'Other'
    )),
    preview_image_url TEXT,
    project_url TEXT,
    status TEXT NOT NULL DEFAULT 'In Review' CHECK (status IN (
        'Draft',
        'In Review',
        'Improving',
        'Completed'
    )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    comment TEXT NOT NULL,
    reviewer_name TEXT,
    category TEXT NOT NULL CHECK (category IN (
        'Visual Design',
        'Usability',
        'Accessibility',
        'Typography',
        'Color and Contrast',
        'Navigation',
        'Responsiveness',
        'Performance',
        'Other'
    )),
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN (
        'Low',
        'Medium',
        'High',
        'Critical'
    )),
    status TEXT NOT NULL DEFAULT 'To Do' CHECK (status IN (
        'To Do',
        'In Progress',
        'Completed'
    )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. AI REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.ai_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL DEFAULT 'feedback_analysis',
    structured_result JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_feedback_project_id ON public.feedback(project_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON public.feedback(priority);
CREATE INDEX IF NOT EXISTS idx_ai_reports_project_id ON public.ai_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_reports_user_id ON public.ai_reports(user_id);

-- UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ATTACH UPDATED_AT TRIGGERS
DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_projects_updated_at ON public.projects;
CREATE TRIGGER tr_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_feedback_updated_at ON public.feedback;
CREATE TRIGGER tr_feedback_updated_at
    BEFORE UPDATE ON public.feedback
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- AUTOMATIC PROFILE CREATION ON USER SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'display_name',
            NEW.raw_user_meta_data->>'full_name',
            split_part(NEW.email, '@', 1)
        ),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_reports ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES: PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- RLS POLICIES: PROJECTS
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
CREATE POLICY "Users can view own projects"
    ON public.projects FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own projects" ON public.projects;
CREATE POLICY "Users can create own projects"
    ON public.projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
CREATE POLICY "Users can update own projects"
    ON public.projects FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
CREATE POLICY "Users can delete own projects"
    ON public.projects FOR DELETE
    USING (auth.uid() = user_id);

-- RLS POLICIES: FEEDBACK
-- Must belong to authenticated user AND associated project must also belong to authenticated user
DROP POLICY IF EXISTS "Users can view own feedback" ON public.feedback;
CREATE POLICY "Users can view own feedback"
    ON public.feedback FOR SELECT
    USING (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE public.projects.id = public.feedback.project_id
            AND public.projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create own feedback" ON public.feedback;
CREATE POLICY "Users can create own feedback"
    ON public.feedback FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE public.projects.id = public.feedback.project_id
            AND public.projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own feedback" ON public.feedback;
CREATE POLICY "Users can update own feedback"
    ON public.feedback FOR UPDATE
    USING (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE public.projects.id = public.feedback.project_id
            AND public.projects.user_id = auth.uid()
        )
    )
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE public.projects.id = public.feedback.project_id
            AND public.projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete own feedback" ON public.feedback;
CREATE POLICY "Users can delete own feedback"
    ON public.feedback FOR DELETE
    USING (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE public.projects.id = public.feedback.project_id
            AND public.projects.user_id = auth.uid()
        )
    );

-- RLS POLICIES: AI REPORTS
DROP POLICY IF EXISTS "Users can view own AI reports" ON public.ai_reports;
CREATE POLICY "Users can view own AI reports"
    ON public.ai_reports FOR SELECT
    USING (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE public.projects.id = public.ai_reports.project_id
            AND public.projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create own AI reports" ON public.ai_reports;
CREATE POLICY "Users can create own AI reports"
    ON public.ai_reports FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE public.projects.id = public.ai_reports.project_id
            AND public.projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete own AI reports" ON public.ai_reports;
CREATE POLICY "Users can delete own AI reports"
    ON public.ai_reports FOR DELETE
    USING (auth.uid() = user_id);
