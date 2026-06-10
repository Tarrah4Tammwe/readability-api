// app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { analyseText } from '@/lib/readability'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing required field: text (string)' },
        { status: 400 }
      )
    }

    const result = analyseText(text)
    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/analyze',
    description: 'Analyse the readability of any English text',
    body: { text: 'string (required) — the text to analyse' },
    returns: [
      'textStats: word count, sentence count, syllable averages',
      'scores: Flesch Reading Ease, Flesch-Kincaid Grade, Gunning Fog, ARI, SMOG',
      'overall: average grade level, plain English verdict, recommended audience',
    ],
    example: {
      text: 'The quick brown fox jumps over the lazy dog. This is a short example sentence for testing purposes.',
    },
  })
}
