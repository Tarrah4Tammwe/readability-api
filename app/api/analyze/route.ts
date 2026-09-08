import { NextRequest, NextResponse } from 'next/server'
import { fetchPublicPage } from '@/lib/fetch-page'
import { handleRouteError, jsonError, optionsResponse, parseJsonObject, requireTextField } from '@/lib/http'
import { rateLimitPost } from '@/lib/rate-limit'
import { analyseText } from '@/lib/readability'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const limited = rateLimitPost(req)
  if (limited) return limited

  try {
    const body = await parseJsonObject(req)
    const { text, url, target_grade } = body

    if (text !== undefined && url !== undefined) {
      return jsonError('Provide either "text" or "url", not both', 400)
    }

    let content: string

    if (url !== undefined) {
      if (typeof url !== 'string') {
        return jsonError('url must be a valid http/https URL', 400)
      }
      content = await fetchPublicPage(url)
    } else if (text !== undefined) {
      content = requireTextField(text, 'text')
    } else {
      return jsonError('Provide either "text" (string) or "url" (string) in the request body', 400)
    }

    let targetGrade: number | undefined
    if (target_grade !== undefined) {
      if (typeof target_grade !== 'number' || !Number.isFinite(target_grade) || target_grade < 1 || target_grade > 20) {
        return jsonError('target_grade must be a number between 1 and 20', 400)
      }
      targetGrade = target_grade
    }

    const result = analyseText(content, targetGrade)
    return NextResponse.json(result)
  } catch (err: unknown) {
    return handleRouteError(err)
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
    limits: {
      text: 'Max 100,000 characters',
      url: 'Public http(s) URLs on port 80 or 443 only. Private/internal hosts are blocked.',
      rateLimit: '60 POST requests per IP per minute',
    },
    returns: [
      'textStats: word count, sentence count, syllable averages, polysyllabic word %',
      'scores: Flesch Reading Ease, Flesch-Kincaid Grade, Gunning Fog, ARI, SMOG',
      'overall: average grade level, verdict, recommended audience, plain English score',
      'suggestions: actionable plain-English tips to improve readability',
      'sentenceBreakdown.all: every sentence scored individually (capped at 200)',
      'sentenceBreakdown.hardest: top 3 hardest sentences',
      'targetResult: (if target_grade provided) pass/fail, gap, message',
    ],
    examples: {
      text: { text: 'Your content here.', target_grade: 8 },
      url: { url: 'https://example.com/article' },
    },
  })
}

export async function OPTIONS() {
  return optionsResponse()
}
