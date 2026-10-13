import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { aiAnalyzeRequestSchema } from '@/lib/validation';
import { analyzeProjectFeedbackWithGemini, isGeminiConfigured } from '@/lib/ai/gemini';
import { Project, FeedbackItem } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Authenticate current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to access the AI assistant.' },
        { status: 401 }
      );
    }

    // 2. Validate request body
    const body = await request.json().catch(() => ({}));
    const parseResult = aiAnalyzeRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { projectId } = parseResult.data;

    // 3. Verify project ownership in Supabase
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !projectData) {
      return NextResponse.json(
        { error: 'Project not found or you do not have permission to analyze it.' },
        { status: 404 }
      );
    }

    // 4. Fetch associated feedback records
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('feedback')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (feedbackError) {
      return NextResponse.json(
        { error: 'Failed to fetch project feedback items.' },
        { status: 500 }
      );
    }

    const feedbackList = (feedbackData || []) as FeedbackItem[];
    if (feedbackList.length === 0) {
      return NextResponse.json(
        {
          error:
            'This project has no feedback items yet. Add feedback on the Feedback Board before running AI analysis.',
        },
        { status: 400 }
      );
    }

    // 5. Check if Gemini is configured
    if (!isGeminiConfigured()) {
      return NextResponse.json(
        {
          error:
            'GEMINI_API_KEY is not configured in the server environment. Please set GEMINI_API_KEY in .env.local to enable real Gemini AI analysis.',
          unconfigured: true,
        },
        { status: 503 }
      );
    }

    // 6. Run Gemini Analysis
    const project = projectData as Project;
    const aiResult = await analyzeProjectFeedbackWithGemini(project, feedbackList);

    // 7. Persist AI Report to database
    const { data: savedReport, error: saveError } = await supabase
      .from('ai_reports')
      .insert({
        project_id: projectId,
        user_id: user.id,
        report_type: 'feedback_analysis',
        structured_result: aiResult,
      })
      .select('id, created_at')
      .single();

    if (saveError) {
      console.warn('Could not save AI report record:', saveError.message);
    }

    return NextResponse.json({
      success: true,
      reportId: savedReport?.id,
      createdAt: savedReport?.created_at,
      result: aiResult,
    });
  } catch (err: unknown) {
    console.error('API /api/ai/analyze-feedback error:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
