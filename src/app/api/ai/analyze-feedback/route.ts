import { NextRequest, NextResponse } from 'next/server';
import { aiAnalyzeRequestSchema } from '@/lib/validation';
import { analyzeProjectFeedbackWithGemini, isGeminiConfigured } from '@/lib/ai/gemini';
import { Project, FeedbackItem } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate payload
    const body = await request.json().catch(() => ({}));
    const parseResult = aiAnalyzeRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed for AI analysis request.',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { project, feedbackItems } = parseResult.data;

    if (!feedbackItems || feedbackItems.length === 0) {
      return NextResponse.json(
        {
          error:
            'This project has no feedback items yet. Add feedback on the Feedback Board before running AI analysis.',
        },
        { status: 400 }
      );
    }

    // 2. Check if Gemini API key is configured on server
    if (!isGeminiConfigured()) {
      return NextResponse.json(
        {
          error:
            'GEMINI_API_KEY is not configured in the server environment. Please set GEMINI_API_KEY in .env.local to enable real Google Gemini AI analysis.',
          unconfigured: true,
        },
        { status: 503 }
      );
    }

    // 3. Execute Google Gemini AI Analysis
    const typedProject = project as unknown as Project;
    const typedFeedback = feedbackItems as unknown as FeedbackItem[];

    const aiResult = await analyzeProjectFeedbackWithGemini(typedProject, typedFeedback);

    return NextResponse.json({
      success: true,
      result: aiResult,
    });
  } catch (err: unknown) {
    console.error('API /api/ai/analyze-feedback error:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
