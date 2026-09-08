import { NextRequest, NextResponse } from 'next/server'
import { handleRouteError, jsonError, optionsResponse, parseJsonObject, requireTextField } from '@/lib/http'
import { rateLimitPost } from '@/lib/rate-limit'
import { analyseText } from '@/lib/readability'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type AnalyseResult = ReturnType<typeof analyseText>

export async function POST(req: NextRequest) {
  const limited = rateLimitPost(req)
  if (limited) return limited

  try {
    const body = await parseJsonObject(req)
    const { text_a, text_b } = body

    if (text_a === undefined) return jsonError('Missing required field: text_a (string)', 400)
    if (text_b === undefined) return jsonError('Missing required field: text_b (string)', 400)

    const textA = requireTextField(text_a, 'text_a')
    const textB = requireTextField(text_b, 'text_b')

    const resultA = analyseText(textA) as AnalyseResult & {
      scores: { fleschReadingEase: { score: number } }
      overall: { averageGradeLevel: number; verdict: string }
      textStats: { wordCount: number }
    }
    const resultB = analyseText(textB) as AnalyseResult & {
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
    return handleRouteError(err)
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
    limits: {
      text: 'Max 100,000 characters per field',
      rateLimit: '60 POST requests per IP per minute',
    },
    returns: [
      'Flesch Reading Ease, grade level, verdict, and word count for both texts',
      'moreReadable: which text scores higher',
      'easeDifference: Flesch points difference',
      'gradeDifference: grade level difference',
    ],
  })
}

export async function OPTIONS() {
  return optionsResponse()
}
