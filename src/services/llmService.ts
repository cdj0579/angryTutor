/**
 * LLM Service - 直接调用 OpenAI 兼容的大语言模型 API
 * 用于评估用户口语回答的准确性、流利度、口音等
 */

const LLM_API_URL = import.meta.env.VITE_LLM_URL || ''
const LLM_MODEL = import.meta.env.VITE_LLM_MODEL || ''
const LLM_API_KEY = import.meta.env.VITE_LLM_API_KEY || ''

export interface LLMEvaluationResult {
  totalScore: number       // 0-100 综合分
  correctnessScore: number // 0-100 准确性
  fluencyScore: number     // 0-100 流利度
  pronunciationScore: number // 0-100 发音/口音
  level: 'excellent' | 'good' | 'fair' | 'poor'
  feedback: string         // LLM 给出的反馈
  correction: string       // 改进建议
  nurseReaction: 'veryHappy' | 'happy' | 'good' | 'slap'
}

/**
 * 调用 LLM 评估用户回答
 */
export async function evaluateWithLLM(
  question: string,
  userAnswer: string,
  expectedAnswers: string[] = [],
  context?: { sceneName?: string; role?: string }
): Promise<LLMEvaluationResult> {
  const roleDesc = context?.role && context?.sceneName
    ? `The student is practicing a conversation at a ${context.sceneName}. The questioner is a ${context.role}.`
    : ''

  const systemPrompt = `You are a professional English teaching assistant. ${roleDesc} Your task is to evaluate a student's spoken English answer to questions in this scenario. Evaluate based on:
1. Correctness - Is the answer contextually and linguistically appropriate for this scenario?
2. Fluency - Is the sentence structure natural and fluent?
3. Pronunciation quality - Based on the transcribed text, are there signs of mispronunciation (unusual word substitutions, phonetically similar errors)?

You MUST respond with ONLY a valid JSON object, no markdown, no extra text.`

  const roleLabel = context?.role || 'Questioner'
  const userPrompt = `${roleLabel}'s question: "${question}"
Student's spoken answer: "${userAnswer}"
Reference correct answers: ${expectedAnswers.length > 0 ? expectedAnswers.join(' / ') : 'None provided'}

Evaluate and return JSON:
{
  "totalScore": <0-100>,
  "correctnessScore": <0-100>,
  "fluencyScore": <0-100>,
  "pronunciationScore": <0-100>,
  "level": "<excellent|good|fair|poor>",
  "feedback": "<Brief encouraging feedback in English, 1-2 sentences>",
  "correction": "<Suggested improvement or model answer, 1 sentence>"
}/no_think`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    console.log('[LLM] Calling:', `${LLM_API_URL}/chat/completions`, 'answer:', userAnswer)

    const response = await fetch(`${LLM_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(LLM_API_KEY ? { 'Authorization': `Bearer ${LLM_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 512,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`LLM API error ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    // 提取 JSON（兼容 markdown 代码块包裹）
    const jsonStr = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('LLM response is not valid JSON')
    }

    const parsed = JSON.parse(jsonMatch[0])

    // 规范化并补全字段
    const totalScore = clamp(parsed.totalScore ?? 50, 0, 100)
    const level = normalizeLevel(parsed.level, totalScore)

    return {
      totalScore,
      correctnessScore: clamp(parsed.correctnessScore ?? totalScore, 0, 100),
      fluencyScore: clamp(parsed.fluencyScore ?? totalScore, 0, 100),
      pronunciationScore: clamp(parsed.pronunciationScore ?? totalScore, 0, 100),
      level,
      feedback: parsed.feedback || 'Keep practicing!',
      correction: parsed.correction || '',
      nurseReaction: getNurseReaction(level),
    }
  } catch (error) {
    console.error('LLM evaluation error:', error)
    // 降级：返回一个基础结果而不是抛异常，保证 UX
    return fallbackEvaluation(userAnswer, expectedAnswers)
  }
}

/**
 * 调用 LLM 生成一道全新的场景对话题目
 */
export async function generateNewQuestion(
  sceneName: string,
  role: string,
  existingQuestions: string[] = []
): Promise<{ question: string; expectedAnswers: string[] }> {
  const systemPrompt = `You are an English teaching content creator. Generate ONE new conversation question that a ${role} would ask at a ${sceneName}. The question should be practical, commonly used in real life, and suitable for English learners.

You MUST respond with ONLY a valid JSON object, no markdown, no extra text.`

  const avoidList = existingQuestions.length > 0
    ? `\nAvoid these questions that were already used:\n${existingQuestions.map(q => `- "${q}"`).join('\n')}`
    : ''

  const userPrompt = `Generate a new ${role} question for a ${sceneName} scenario.${avoidList}

Return JSON:
{
  "question": "<A natural question the ${role} would ask, 1 sentence>",
  "expectedAnswers": ["<3-4 reasonable student responses>"]
}/no_think`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(`${LLM_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(LLM_API_KEY ? { 'Authorization': `Bearer ${LLM_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.9,
        max_tokens: 300,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) throw new Error(`LLM API error ${response.status}`)

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    const jsonStr = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Invalid JSON')

    const parsed = JSON.parse(jsonMatch[0])
    return {
      question: parsed.question || 'Could you tell me more about your situation?',
      expectedAnswers: Array.isArray(parsed.expectedAnswers) ? parsed.expectedAnswers : [],
    }
  } catch (err) {
    console.error('[LLM] generateNewQuestion error:', err)
    return {
      question: `Hello, how can I help you today at the ${sceneName}?`,
      expectedAnswers: ['I need some help please', 'I have a question', 'Could you assist me?'],
    }
  }
}

/**
 * 调用 LLM 生成 TTS 要朗读的反馈文本（可选，如果想让 LLM 生成更丰富的口头反馈）
 */
export async function generateSpokenFeedback(
  feedback: string,
  correction: string
): Promise<string> {
  // 直接拼接即可，不需要额外 LLM 调用
  const parts: string[] = []
  if (feedback) parts.push(feedback)
  if (correction) parts.push(correction)
  return parts.join(' ') || 'Good try! Keep practicing.'
}

// ---- helpers ----

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function normalizeLevel(
  raw: string | undefined,
  score: number
): 'excellent' | 'good' | 'fair' | 'poor' {
  if (raw === 'excellent' || raw === 'good' || raw === 'fair' || raw === 'poor') {
    return raw
  }
  if (score >= 90) return 'excellent'
  if (score >= 75) return 'good'
  if (score >= 60) return 'fair'
  return 'poor'
}

function getNurseReaction(
  level: 'excellent' | 'good' | 'fair' | 'poor'
): 'veryHappy' | 'happy' | 'good' | 'slap' {
  switch (level) {
    case 'excellent': return 'veryHappy'
    case 'good': return 'happy'
    case 'fair': return 'good'
    case 'poor': return 'slap'
  }
}

/**
 * 降级本地评分（当 LLM 不可用时）
 */
function fallbackEvaluation(
  userAnswer: string,
  expectedAnswers: string[]
): LLMEvaluationResult {
  const userTokens = tokenize(userAnswer.toLowerCase())

  let bestSimilarity = 0
  for (const expected of expectedAnswers) {
    const expectedTokens = tokenize(expected.toLowerCase())
    const intersection = userTokens.filter(t => expectedTokens.includes(t)).length
    const union = new Set([...userTokens, ...expectedTokens]).size
    const sim = union === 0 ? 0 : intersection / union
    bestSimilarity = Math.max(bestSimilarity, sim)
  }

  const totalScore = Math.round(bestSimilarity * 100)
  const level = normalizeLevel(undefined, totalScore)

  return {
    totalScore,
    correctnessScore: totalScore,
    fluencyScore: Math.min(totalScore + 10, 100),
    pronunciationScore: Math.min(totalScore + 5, 100),
    level,
    feedback: totalScore >= 70
      ? 'Good answer! (evaluated offline)'
      : 'Keep practicing! (evaluated offline)',
    correction: '',
    nurseReaction: getNurseReaction(level),
  }
}

function tokenize(text: string): string[] {
  return text.split(/\s+/).filter(w => w.length > 0).map(w => w.replace(/[^\w]/g, ''))
}
