import { NextRequest, NextResponse } from 'next/server'
import { analyseText } from '@/lib/readability'

type AnalyseResult = ReturnType<typeof analyseText>

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text_a, text_b } = body

    if (!text_a || typeof text_a !== 'string')
      return NextResponse.json({ success: false, error: 'Missing required field: text_a (string)' }, { status: 400 })
    if (!text_b || typeof text_b !== 'string')
      return NextResponse.json({ success: false, error: 'Missing required field: text_b (string)' }, { status: 400 })

    const resultA = analyseText(text_a) as AnalyseResult & {
      scores: { fleschReadingEase: { score: number } }
      overall: { averageGradeLevel: number; verdict: string }
      textStats: { wordCount: number }
    }
    const resultB = analyseText(text_b) as AnalyseResult & {
      scores: { fleschReadingEase: { score: number } }
      overall: { averageGradeLevel: number; verdict: string }
      textStats: { wordCount: number }
    }

    const scoreA = resultA.scores.fleschReadingEase.score
    const scoreB = resultB.scores.fleschReadingEase.score
    const moreReadable = scoreA >= scoreB ? 'text_a' : 'text_b'

    return NextResponse.json({
      success: true,
      text_a: {
        fleschReadingEase: scoreA,
        gradeLevel: resultA.overall.averageGradeLevel,
        verdict: resultA.overall.verdict,
        wordCount: resultA.textStats.wordCount,
      },
      text_b: {
        fleschReadingEase: scoreB,
        gradeLevel: resultB.overall.averageGradeLevel,
        verdict: resultB.overall.verdict,
        wordCount: resultB.textStats.wordCount,
      },
      comparison: {
        moreReadable,
        easeDifference: parseFloat(Math.abs(scoreA - scoreB).toFixed(1)),
        gradeDifference: parseFloat(
          Math.abs(resultA.overall.averageGradeLevel - resultB.overall.averageGradeLevel).toFixed(1)
        ),
        summary:
          moreReadable === 'text_a'
            ? `text_a is easier to read by ${Math.abs(scoreA - scoreB).toFixed(1)} Flesch points`
            : `text_b is easier to read by ${Math.abs(scoreA - scoreB).toFixed(1)} Flesch points`,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/compare',
    description: 'Compare the readability of two texts side by side',
    body: {
      text_a: 'string (required) — first text',
      text_b: 'string (required) — second text',
    },
    returns: [
      'Flesch Reading Ease, grade level, verdict, and word count for both texts',
      'moreReadable: which text scores higher',
      'easeDifference: Flesch points difference',
      'gradeDifference: grade level difference',
    ],
  })
}
