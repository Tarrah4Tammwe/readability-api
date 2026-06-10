import { NextRequest, NextResponse } from 'next/server'
import { analyseText } from '@/lib/readability'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text, url, target_grade } = body

    let content: string

    if (url) {
      // Fetch and extract text from URL
      if (typeof url !== 'string' || !url.startsWith('http')) {
        return NextResponse.json({ success: false, error: 'url must be a valid http/https URL' }, { status: 400 })
      }
      const res = await fetch(url, {
        headers: { 'User-Agent': 'ReadabilityAPI/1.0' },
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) {
        return NextResponse.json({ success: false, error: `Failed to fetch URL: HTTP ${res.status}` }, { status: 400 })
      }
      const html = await res.text()
      // Strip HTML tags and collapse whitespace
      content = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s{2,}/g, ' ')
        .trim()
    } else if (text) {
      if (typeof text !== 'string') {
        return NextResponse.json({ success: false, error: 'text must be a string' }, { status: 400 })
      }
      content = text
    } else {
      return NextResponse.json(
        { success: false, error: 'Provide either "text" (string) or "url" (string) in the request body' },
        { status: 400 }
      )
    }

    const targetGrade = target_grade !== undefined ? Number(target_grade) : undefined
    if (targetGrade !== undefined && (isNaN(targetGrade) || targetGrade < 1 || targetGrade > 20)) {
      return NextResponse.json({ success: false, error: 'target_grade must be a number between 1 and 20' }, { status: 400 })
    }

    const result = analyseText(content, targetGrade)
    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/analyze',
    description: 'Analyse the readability of English text or a URL',
    body: {
      text: 'string — raw text to analyse (required if no url)',
      url: 'string — public URL to fetch and analyse (required if no text)',
      target_grade: 'number (optional) — target grade level (1–20). Returns pass/fail result.',
    },
    returns: [
      'textStats: word count, sentence count, syllable averages, polysyllabic word %',
      'scores: Flesch Reading Ease, Flesch-Kincaid Grade, Gunning Fog, ARI, SMOG',
      'overall: average grade level, verdict, recommended audience, plain English score',
      'suggestions: actionable plain-English tips to improve readability',
      'sentenceBreakdown.all: every sentence scored individually',
      'sentenceBreakdown.hardest: top 3 hardest sentences',
      'targetResult: (if target_grade provided) pass/fail, gap, message',
    ],
    examples: {
      text: { text: 'Your content here.', target_grade: 8 },
      url: { url: 'https://example.com/article' },
    },
  })
}
