import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ClientError } from './errors'
import {
  analyseText,
  calcFRE,
  countSyllables,
  getTargetResult,
  getTextStats,
} from './readability'

describe('countSyllables', () => {
  it('counts common words used in previous QC fixes', () => {
    assert.equal(countSyllables('table'), 2)
    assert.equal(countSyllables('simple'), 2)
    assert.equal(countSyllables('complicated'), 4)
    assert.equal(countSyllables('jumped'), 1)
    assert.equal(countSyllables('wanted'), 2)
    assert.equal(countSyllables('the'), 1)
    assert.equal(countSyllables('cat'), 1)
  })
})

describe('getTextStats', () => {
  it('does not produce NaN for punctuation-only input', () => {
    const stats = getTextStats('!!! ??? ---')
    assert.equal(stats.wordCount, 0)
    assert.equal(stats.avgSentenceLength, 0)
    assert.equal(stats.avgSyllablesPerWord, 0)
    assert.equal(Number.isNaN(stats.polysyllabicWordPercentage), false)
  })
})

describe('analyseText', () => {
  it('rejects text that is too short', () => {
    assert.throws(() => analyseText('too short'), ClientError)
    assert.throws(() => analyseText('one two three four'), ClientError)
  })

  it('scores a simple paragraph in the easy-to-moderate range', () => {
    const result = analyseText(
      'The cat sat on the mat. The dog ran to the park. Kids like to play with friends at school.',
      8
    ) as {
      success: boolean
      scores: { fleschReadingEase: { score: number } }
      overall: { averageGradeLevel: number; verdict: string }
      targetResult: { passed: boolean; targetGrade: number }
      suggestions: string[]
      sentenceBreakdown: { all: unknown[]; hardest: unknown[] }
    }

    assert.equal(result.success, true)
    assert.equal(result.scores.fleschReadingEase.score >= 50, true)
    assert.equal(result.overall.averageGradeLevel < 12, true)
    assert.equal(result.targetResult.passed, true)
    assert.equal(result.targetResult.targetGrade, 8)
    assert.equal(result.sentenceBreakdown.all.length > 0, true)
    assert.equal(result.suggestions.length > 0, true)
  })

  it('flags dense academic wording as harder', () => {
    const easy = analyseText(
      'The cat sat on the mat. The dog ran to the park. Kids like to play with friends at school every day after class.'
    ) as { scores: { fleschReadingEase: { score: number } } }
    const hard = analyseText(
      'The utilisation of sophisticated terminology necessitates considerable cognitive effort from readers encountering dense academic prose during preliminary examination of institutional documentation.'
    ) as { scores: { fleschReadingEase: { score: number } } }

    assert.equal(hard.scores.fleschReadingEase.score < easy.scores.fleschReadingEase.score, true)
  })
})

describe('formulas', () => {
  it('clamps Flesch Reading Ease to 0-100', () => {
    assert.equal(calcFRE(1, 1) <= 100, true)
    assert.equal(calcFRE(80, 5) >= 0, true)
  })

  it('computes target gaps correctly', () => {
    const pass = getTargetResult(7.2, 8)
    assert.equal(pass.passed, true)
    const fail = getTargetResult(10.2, 8)
    assert.equal(fail.passed, false)
    assert.equal(fail.gap, 2.2)
  })
})
