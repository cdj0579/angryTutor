/**
 * Answer Scoring Service
 * Evaluates user's spoken answers based on correctness, fluency, and pronunciation
 */

export type ScoreLevel = 'excellent' | 'good' | 'fair' | 'poor'

export interface AnswerScore {
  totalScore: number // 0-100
  correctnessScore: number // 0-100
  fluencyScore: number // 0-100
  pronunciationScore: number // 0-100
  level: ScoreLevel
  feedback: string
  nurseReaction: 'veryHappy' | 'happy' | 'good' | 'slap'
}

class AnswerScoringService {
  /**
   * Evaluate user's answer based on multiple criteria
   */
  public evaluateAnswer(
    userAnswer: string,
    expectedAnswers: string[],
    speakingTime: number // in milliseconds
  ): AnswerScore {
    const correctnessScore = this.calculateCorrectness(
      userAnswer,
      expectedAnswers
    )
    const fluencyScore = this.calculateFluency(userAnswer, speakingTime)
    const pronunciationScore = this.calculatePronunciation(
      userAnswer,
      expectedAnswers
    )

    // Weight the scores
    const totalScore = Math.round(
      correctnessScore * 0.5 + fluencyScore * 0.25 + pronunciationScore * 0.25
    )

    const level = this.getScoreLevel(totalScore)
    const feedback = this.generateFeedback(level, totalScore)
    const nurseReaction = this.getNurseReaction(level)

    return {
      totalScore,
      correctnessScore,
      fluencyScore,
      pronunciationScore,
      level,
      feedback,
      nurseReaction,
    }
  }

  /**
   * Calculate correctness score by comparing with expected answers
   * Uses Levenshtein distance for similarity matching
   */
  private calculateCorrectness(
    userAnswer: string,
    expectedAnswers: string[]
  ): number {
    if (!userAnswer || expectedAnswers.length === 0) {
      return 0
    }

    const userTokens = this.tokenize(userAnswer.toLowerCase())
    const scores = expectedAnswers.map((expected) => {
      const expectedTokens = this.tokenize(expected.toLowerCase())
      return this.calculateSimilarity(userTokens, expectedTokens)
    })

    return Math.round(Math.max(...scores) * 100)
  }

  /**
   * Calculate fluency score based on speaking time and word count
   * Good fluency: ~0.5-0.7 seconds per word natural speech pace
   */
  private calculateFluency(userAnswer: string, speakingTime: number): number {
    if (speakingTime < 500) {
      // Too quick - less than 500ms
      return 40
    }

    const wordCount = this.tokenize(userAnswer).length
    const timePerWord = speakingTime / (wordCount || 1)

    // Ideal speaking pace: 500-1000ms per word
    if (timePerWord >= 500 && timePerWord <= 1200) {
      return 95
    } else if (timePerWord >= 300 && timePerWord <= 1500) {
      return 85
    } else if (timePerWord >= 200 && timePerWord <= 2000) {
      return 70
    } else {
      return 50
    }
  }

  /**
   * Calculate pronunciation score based on character-level matching
   * Simulates pronunciation quality through phonetic similarity
   */
  private calculatePronunciation(
    userAnswer: string,
    expectedAnswers: string[]
  ): number {
    if (!userAnswer || expectedAnswers.length === 0) {
      return 0
    }

    // Find best matching expected answer
    const bestMatch = expectedAnswers.reduce((best, current) => {
      const currentSimilarity = this.calculateCharSimilarity(
        userAnswer.toLowerCase(),
        current.toLowerCase()
      )
      const bestSimilarity = this.calculateCharSimilarity(
        userAnswer.toLowerCase(),
        best.toLowerCase()
      )
      return currentSimilarity > bestSimilarity ? current : best
    })

    const charSimilarity = this.calculateCharSimilarity(
      userAnswer.toLowerCase(),
      bestMatch.toLowerCase()
    )

    // If character similarity > 85%, pronunciation is considered good
    if (charSimilarity > 0.85) {
      return 95
    } else if (charSimilarity > 0.75) {
      return 85
    } else if (charSimilarity > 0.65) {
      return 70
    } else if (charSimilarity > 0.5) {
      return 55
    } else {
      return 30
    }
  }

  /**
   * Calculate token-level similarity using Jaccard similarity
   */
  private calculateSimilarity(tokens1: string[], tokens2: string[]): number {
    if (tokens1.length === 0 && tokens2.length === 0) {
      return 1
    }

    const set1 = new Set(tokens1)
    const set2 = new Set(tokens2)

    const intersection = tokens1.filter((token) => set2.has(token)).length
    const union = new Set([...tokens1, ...tokens2]).size

    return union === 0 ? 0 : intersection / union
  }

  /**
   * Calculate character-level similarity using Levenshtein distance
   */
  private calculateCharSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1, str2)
    const maxLen = Math.max(str1.length, str2.length)
    return 1 - distance / maxLen
  }

  /**
   * Levenshtein distance algorithm
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = []

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        }
      }
    }

    return matrix[str2.length][str1.length]
  }

  /**
   * Tokenize answer into words
   */
  private tokenize(text: string): string[] {
    return text
      .split(/\s+/)
      .filter((word) => word.length > 0)
      .map((word) => word.replace(/[^\w]/g, ''))
  }

  /**
   * Determine score level based on total score
   */
  private getScoreLevel(score: number): ScoreLevel {
    if (score >= 90) return 'excellent'
    if (score >= 75) return 'good'
    if (score >= 60) return 'fair'
    return 'poor'
  }

  /**
   * Generate contextual feedback message
   */
  private generateFeedback(level: ScoreLevel, score: number): string {
    const feedbackMap: Record<ScoreLevel, string> = {
      excellent: `Perfect! Your answer was spot on (${score}/100). Great pronunciation and fluency!`,
      good: `Very good! Your answer was accurate (${score}/100). Keep up the good work!`,
      fair: `Good effort! Your answer was mostly correct (${score}/100). Practice your pronunciation.`,
      poor: `Not quite right. Your answer needs improvement (${score}/100). Try again!`,
    }
    return feedbackMap[level]
  }

  /**
   * Map score level to nurse reaction
   */
  private getNurseReaction(
    level: ScoreLevel
  ): 'veryHappy' | 'happy' | 'good' | 'slap' {
    switch (level) {
      case 'excellent':
        return 'veryHappy'
      case 'good':
        return 'happy'
      case 'fair':
        return 'good'
      case 'poor':
        return 'slap'
    }
  }
}

export const answerScoringService = new AnswerScoringService()
