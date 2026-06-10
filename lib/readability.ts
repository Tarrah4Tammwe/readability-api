// lib/readability.ts

// ─── Syllable counter ────────────────────────────────────────────────────────

export function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '')
  if (!word) return 0
  if (word.length <= 3) return 1

  let count = 0
  let prevVowel = false
  for (let i = 0; i < word.length; i++) {
    const isVowel = 'aeiouy'.includes(word[i])
    if (isVowel && !prevVowel) count++
    prevVowel = isVowel
  }

  // Silent trailing 'e' (make, take) — not for le/ee/oe/ed endings
  if (
    word.endsWith('e') &&
    !word.endsWith('le') &&
    !word.endsWith('ee') &&
    !word.endsWith('oe') &&
    !word.endsWith('ed') &&
    count > 1 &&
    !'aeiouy'.includes(word[word.length - 2])
  ) {
    count--
  }

  // Silent '-ed' (jumped, called) — NOT silent after t/d (wanted, needed)
  if (word.endsWith('ed') && word.length > 3) {
    const beforeEd = word[word.length - 3]
    if (!'td'.includes(beforeEd) && !'aeiouy'.includes(beforeEd)) {
      count = Math.max(1, count - 1)
    }
  }

  return Math.max(1, count)
}

// ─── Text splitting ──────────────────────────────────────────────────────────

export function splitSentences(text: string): string[] {
  return text
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
}

export function countWords(text: string): string[] {
  return text
    .trim()
    .split(/\s+/)
    .filter(w => w.replace(/[^a-zA-Z]/g, '').length > 0)
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export function getTextStats(text: string) {
  const words = countWords(text)
  const wordCount = words.length
  const sentences = splitSentences(text)
  const sentenceCount = Math.max(1, sentences.length)
  const charCount = text.replace(/\s/g, '').length

  const syllableCounts = words.map(w => countSyllables(w))
  const totalSyllables = syllableCounts.reduce((a, b) => a + b, 0)
  const polysyllabicWords = words.filter((_, i) => syllableCounts[i] >= 3)

  const avgSentenceLength = wordCount / sentenceCount
  const avgSyllablesPerWord = totalSyllables / wordCount

  return {
    wordCount,
    sentenceCount,
    sentences,
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

// ─── Scoring formulas ────────────────────────────────────────────────────────

export function calcFRE(avgSentenceLength: number, avgSyllablesPerWord: number): number {
  const raw = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord
  return parseFloat(Math.min(100, Math.max(0, raw)).toFixed(1))
}

export function calcFKG(avgSentenceLength: number, avgSyllablesPerWord: number): number {
  return parseFloat(Math.max(0, 0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59).toFixed(1))
}

export function fleschReadingEase(stats: ReturnType<typeof getTextStats>) {
  const score = calcFRE(stats.avgSentenceLength, stats.avgSyllablesPerWord)
  let interpretation: string, suitableFor: string
  if (score >= 90) { interpretation = 'Very easy'; suitableFor = 'Age 11 and under' }
  else if (score >= 80) { interpretation = 'Easy'; suitableFor = 'Age 11–13' }
  else if (score >= 70) { interpretation = 'Fairly easy'; suitableFor = 'Age 13–15' }
  else if (score >= 60) { interpretation = 'Standard'; suitableFor = 'Age 15–17' }
  else if (score >= 50) { interpretation = 'Fairly difficult'; suitableFor = 'College students' }
  else if (score >= 30) { interpretation = 'Difficult'; suitableFor = 'University graduates' }
  else { interpretation = 'Very confusing'; suitableFor = 'Professional specialists' }
  return { score, interpretation, suitableFor }
}

export function fleschKincaidGrade(stats: ReturnType<typeof getTextStats>) {
  const score = calcFKG(stats.avgSentenceLength, stats.avgSyllablesPerWord)
  return { score, interpretation: score < 1 ? 'Pre-school level' : `US Grade ${Math.round(score)} reading level` }
}

export function gunningFog(stats: ReturnType<typeof getTextStats>) {
  const score = parseFloat((0.4 * (stats.avgSentenceLength + stats.polysyllabicWordPercentage)).toFixed(1))
  let interpretation: string
  if (score <= 6) interpretation = 'Very easy'
  else if (score <= 8) interpretation = 'Easy'
  else if (score <= 10) interpretation = 'Ideal for general audience'
  else if (score <= 12) interpretation = 'Acceptable'
  else if (score <= 14) interpretation = 'Hard to read'
  else interpretation = 'Very hard to read — consider simplifying'
  return { score, interpretation }
}

export function automatedReadabilityIndex(stats: ReturnType<typeof getTextStats>) {
  const score = parseFloat(
    Math.max(1, 4.71 * (stats.charCount / stats.wordCount) + 0.5 * (stats.wordCount / stats.sentenceCount) - 21.43).toFixed(1)
  )
  return { score, interpretation: `Roughly Grade ${Math.round(score)} reading level` }
}

export function smogIndex(stats: ReturnType<typeof getTextStats>) {
  const score = parseFloat((3 + Math.sqrt(stats.polysyllabicWordCount * (30 / stats.sentenceCount))).toFixed(1))
  return {
    score,
    interpretation: `Grade ${Math.max(1, Math.round(score))} reading level`,
    ...(stats.sentenceCount < 30 && { note: 'SMOG is most accurate with 30+ sentences' }),
  }
}

export function getVerdict(avgGrade: number) {
  const plainEnglishScore = Math.max(0, Math.min(100, Math.round(100 - avgGrade * 5)))
  if (avgGrade <= 6) return { verdict: 'Very easy read', recommendedFor: 'General public, all ages', plainEnglishScore }
  if (avgGrade <= 8) return { verdict: 'Easy read', recommendedFor: 'Most adults', plainEnglishScore }
  if (avgGrade <= 10) return { verdict: 'Moderate', recommendedFor: 'Adults with average education', plainEnglishScore }
  if (avgGrade <= 12) return { verdict: 'Complex', recommendedFor: 'Educated adults', plainEnglishScore }
  if (avgGrade <= 14) return { verdict: 'Very complex', recommendedFor: 'University-educated adults', plainEnglishScore }
  return { verdict: 'Highly technical', recommendedFor: 'Subject matter experts only', plainEnglishScore }
}

// ─── Suggestions ─────────────────────────────────────────────────────────────

export function getSuggestions(
  stats: ReturnType<typeof getTextStats>,
  avgGrade: number,
  freScore: number
): string[] {
  const suggestions: string[] = []

  if (stats.avgSentenceLength > 25) {
    suggestions.push(
      `Your sentences average ${stats.avgSentenceLength.toFixed(0)} words — that's long. Aim for 15–20 words per sentence. Try splitting any sentence over 30 words into two.`
    )
  } else if (stats.avgSentenceLength > 20) {
    suggestions.push(
      `Your average sentence length is ${stats.avgSentenceLength.toFixed(0)} words. Cutting this below 20 will noticeably improve readability.`
    )
  }

  if (stats.polysyllabicWordPercentage > 20) {
    suggestions.push(
      `${stats.polysyllabicWordPercentage}% of your words have 3+ syllables — that's high. Replace complex words with simpler alternatives where meaning allows.`
    )
  } else if (stats.polysyllabicWordPercentage > 12) {
    suggestions.push(
      `${stats.polysyllabicWordPercentage}% of your words are polysyllabic. Reducing this below 10% will improve your Gunning Fog and SMOG scores significantly.`
    )
  }

  if (freScore < 30) {
    suggestions.push(
      `Your Flesch Reading Ease score of ${freScore} is very low. This text will be difficult for most readers. Focus on shorter sentences and simpler vocabulary.`
    )
  } else if (freScore < 50) {
    suggestions.push(
      `A Flesch Reading Ease of ${freScore} means most general readers will struggle. Aim for 60+ for everyday content.`
    )
  }

  if (avgGrade > 14) {
    suggestions.push(
      `This reads at a post-graduate level (Grade ${avgGrade.toFixed(0)}). Unless writing for specialists, simplify significantly.`
    )
  } else if (avgGrade > 12) {
    suggestions.push(
      `Grade ${avgGrade.toFixed(0)} reading level. For general audiences, aim for Grade 8–10.`
    )
  }

  if (stats.wordCount < 100) {
    suggestions.push(
      `Text is short (${stats.wordCount} words). Readability scores are most reliable with 100+ words.`
    )
  }

  if (suggestions.length === 0) {
    suggestions.push('Readability looks good. No major issues detected.')
  }

  return suggestions
}

// ─── Sentence breakdown ───────────────────────────────────────────────────────

export function getSentenceBreakdown(sentences: string[]) {
  return sentences.map((sentence, index) => {
    const words = countWords(sentence)
    if (words.length < 3) {
      return { index: index + 1, sentence, wordCount: words.length, fre: 100, grade: 0, complexity: 'Very easy' }
    }
    const syls = words.map(w => countSyllables(w))
    const totalSyls = syls.reduce((a, b) => a + b, 0)
    const asl = words.length
    const asw = totalSyls / words.length
    const fre = calcFRE(asl, asw)
    const grade = calcFKG(asl, asw)

    let complexity: string
    if (fre >= 70) complexity = 'Easy'
    else if (fre >= 50) complexity = 'Moderate'
    else if (fre >= 30) complexity = 'Hard'
    else complexity = 'Very hard'

    return { index: index + 1, sentence, wordCount: words.length, fre, grade: parseFloat(grade.toFixed(1)), complexity }
  })
}

// ─── Target scoring ───────────────────────────────────────────────────────────

export function getTargetResult(avgGrade: number, targetGrade: number) {
  const gap = parseFloat((avgGrade - targetGrade).toFixed(1))
  const passed = gap <= 0

  let message: string
  if (passed) {
    message = `Text meets the Grade ${targetGrade} target. Current level: Grade ${avgGrade.toFixed(1)}.`
  } else {
    message = `Text is ${gap} grade levels above the Grade ${targetGrade} target. Current level: Grade ${avgGrade.toFixed(1)}.`
  }

  return { passed, targetGrade, actualGrade: parseFloat(avgGrade.toFixed(1)), gap, message }
}

// ─── Main analyseText function ────────────────────────────────────────────────

export function analyseText(text: string, targetGrade?: number) {
  if (!text || text.trim().length < 10) throw new Error('Text must be at least 10 characters')

  const stats = getTextStats(text)
  if (stats.wordCount < 5) throw new Error('Text must contain at least 5 words for accurate scoring')

  const fre = fleschReadingEase(stats)
  const fkg = fleschKincaidGrade(stats)
  const fog = gunningFog(stats)
  const ari = automatedReadabilityIndex(stats)
  const smog = smogIndex(stats)

  const grades = [fkg.score, fog.score, ari.score, smog.score].filter(s => s > 0)
  const avgGrade = parseFloat((grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1))
  const overall = getVerdict(avgGrade)

  const suggestions = getSuggestions(stats, avgGrade, fre.score)

  const sentenceBreakdown = getSentenceBreakdown(stats.sentences)
  const hardestSentences = [...sentenceBreakdown]
    .sort((a, b) => a.fre - b.fre)
    .slice(0, 3)

  const result: Record<string, unknown> = {
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
    overall: { averageGradeLevel: avgGrade, ...overall },
    suggestions,
    sentenceBreakdown: {
      all: sentenceBreakdown,
      hardest: hardestSentences,
    },
  }

  if (targetGrade !== undefined) {
    result.targetResult = getTargetResult(avgGrade, targetGrade)
  }

  return result
}
