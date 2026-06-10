// lib/readability.ts
// Pure math — no external dependencies

export function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '')
  if (!word) return 0
  if (word.length <= 3) return 1

  // Remove trailing silent e
  word = word.replace(/e$/, '')
  // Remove trailing ed, es unless it's the whole word
  word = word.replace(/(?:ed|es)$/, '')

  const vowelGroups = word.match(/[aeiouy]+/g)
  const count = vowelGroups ? vowelGroups.length : 1
  return Math.max(1, count)
}

export function countSentences(text: string): number {
  const cleaned = text.trim()
  if (!cleaned) return 0
  const matches = cleaned.match(/[^.!?]*[.!?]+/g)
  if (!matches) return 1
  return Math.max(1, matches.length)
}

export function countWords(text: string): string[] {
  return text
    .trim()
    .split(/\s+/)
    .filter(w => w.replace(/[^a-zA-Z]/g, '').length > 0)
}

export function getTextStats(text: string) {
  const words = countWords(text)
  const wordCount = words.length
  const sentenceCount = countSentences(text)
  const charCount = text.replace(/\s/g, '').length

  const syllableCounts = words.map(w => countSyllables(w))
  const totalSyllables = syllableCounts.reduce((a, b) => a + b, 0)
  const polysyllabicWords = words.filter((_, i) => syllableCounts[i] >= 3)

  const avgSentenceLength = wordCount / sentenceCount
  const avgSyllablesPerWord = totalSyllables / wordCount

  return {
    wordCount,
    sentenceCount,
    charCount,
    totalSyllables,
    avgSentenceLength,
    avgSyllablesPerWord,
    polysyllabicWordCount: polysyllabicWords.length,
    polysyllabicWordPercentage: parseFloat(
      ((polysyllabicWords.length / wordCount) * 100).toFixed(1)
    ),
  }
}

export function fleschReadingEase(stats: ReturnType<typeof getTextStats>): {
  score: number
  interpretation: string
  suitableFor: string
} {
  const score = parseFloat(
    (
      206.835 -
      1.015 * stats.avgSentenceLength -
      84.6 * stats.avgSyllablesPerWord
    ).toFixed(1)
  )

  let interpretation: string
  let suitableFor: string

  if (score >= 90) { interpretation = 'Very easy'; suitableFor = 'Age 11 and under' }
  else if (score >= 80) { interpretation = 'Easy'; suitableFor = 'Age 11–13' }
  else if (score >= 70) { interpretation = 'Fairly easy'; suitableFor = 'Age 13–15' }
  else if (score >= 60) { interpretation = 'Standard'; suitableFor = 'Age 15–17' }
  else if (score >= 50) { interpretation = 'Fairly difficult'; suitableFor = 'College students' }
  else if (score >= 30) { interpretation = 'Difficult'; suitableFor = 'University graduates' }
  else { interpretation = 'Very confusing'; suitableFor = 'Professional specialists' }

  return { score, interpretation, suitableFor }
}

export function fleschKincaidGrade(stats: ReturnType<typeof getTextStats>): {
  score: number
  interpretation: string
} {
  const score = parseFloat(
    (
      0.39 * stats.avgSentenceLength +
      11.8 * stats.avgSyllablesPerWord -
      15.59
    ).toFixed(1)
  )
  return {
    score,
    interpretation: score < 0 ? 'Pre-school level' : `US Grade ${Math.round(score)} reading level`,
  }
}

export function gunningFog(stats: ReturnType<typeof getTextStats>): {
  score: number
  interpretation: string
} {
  const score = parseFloat(
    (0.4 * (stats.avgSentenceLength + stats.polysyllabicWordPercentage)).toFixed(1)
  )
  let interpretation: string
  if (score <= 6) interpretation = 'Very easy'
  else if (score <= 8) interpretation = 'Easy'
  else if (score <= 10) interpretation = 'Ideal for general audience'
  else if (score <= 12) interpretation = 'Acceptable'
  else if (score <= 14) interpretation = 'Hard to read'
  else interpretation = 'Very hard to read — consider simplifying'

  return { score, interpretation }
}

export function automatedReadabilityIndex(
  stats: ReturnType<typeof getTextStats>
): { score: number; interpretation: string } {
  const score = parseFloat(
    (
      4.71 * (stats.charCount / stats.wordCount) +
      0.5 * (stats.wordCount / stats.sentenceCount) -
      21.43
    ).toFixed(1)
  )
  return {
    score,
    interpretation: `Roughly Grade ${Math.max(1, Math.round(score))} reading level`,
  }
}

export function smogIndex(stats: ReturnType<typeof getTextStats>): {
  score: number
  interpretation: string
} {
  // SMOG requires at least 30 sentences for accuracy
  const score = parseFloat(
    (
      3 +
      Math.sqrt(
        stats.polysyllabicWordCount * (30 / stats.sentenceCount)
      )
    ).toFixed(1)
  )
  return {
    score,
    note:
      stats.sentenceCount < 30
        ? 'SMOG is most accurate with 30+ sentences'
        : undefined,
    interpretation: `Grade ${Math.max(1, Math.round(score))} reading level`,
  } as { score: number; interpretation: string; note?: string }
}

export function getVerdict(avgGrade: number): {
  verdict: string
  recommendedFor: string
  plainEnglishScore: number
} {
  const plainEnglishScore = Math.max(0, Math.min(100, Math.round(100 - avgGrade * 5)))

  if (avgGrade <= 6)
    return { verdict: 'Very easy read', recommendedFor: 'General public, all ages', plainEnglishScore }
  if (avgGrade <= 8)
    return { verdict: 'Easy read', recommendedFor: 'Most adults', plainEnglishScore }
  if (avgGrade <= 10)
    return { verdict: 'Moderate', recommendedFor: 'Adults with average education', plainEnglishScore }
  if (avgGrade <= 12)
    return { verdict: 'Complex', recommendedFor: 'Educated adults', plainEnglishScore }
  if (avgGrade <= 14)
    return { verdict: 'Very complex', recommendedFor: 'University-educated adults', plainEnglishScore }
  return {
    verdict: 'Highly technical',
    recommendedFor: 'Subject matter experts only',
    plainEnglishScore,
  }
}

export function analyseText(text: string) {
  if (!text || text.trim().length < 10) {
    throw new Error('Text must be at least 10 characters')
  }

  const stats = getTextStats(text)

  if (stats.wordCount < 5) {
    throw new Error('Text must contain at least 5 words for accurate scoring')
  }

  const fre = fleschReadingEase(stats)
  const fkg = fleschKincaidGrade(stats)
  const fog = gunningFog(stats)
  const ari = automatedReadabilityIndex(stats)
  const smog = smogIndex(stats)

  const grades = [fkg.score, fog.score, ari.score, smog.score].filter(
    s => s > 0
  )
  const avgGrade = parseFloat(
    (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1)
  )

  const overall = getVerdict(avgGrade)

  return {
    success: true,
    textStats: {
      wordCount: stats.wordCount,
      sentenceCount: stats.sentenceCount,
      characterCount: stats.charCount,
      avgSentenceLength: parseFloat(stats.avgSentenceLength.toFixed(1)),
      avgSyllablesPerWord: parseFloat(stats.avgSyllablesPerWord.toFixed(2)),
      polysyllabicWordCount: stats.polysyllabicWordCount,
      polysyllabicWordPercentage: stats.polysyllabicWordPercentage,
    },
    scores: {
      fleschReadingEase: fre,
      fleschKincaidGrade: fkg,
      gunningFog: fog,
      automatedReadabilityIndex: ari,
      smogIndex: smog,
    },
    overall: {
      averageGradeLevel: avgGrade,
      ...overall,
    },
  }
}
