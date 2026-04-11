export interface PracticeRecord {
  id: string
  sceneId: string
  sceneName: string
  date: string
  score: number
  maxScore: number
  percentage: number
  answers: {
    dialogId: string
    question: string
    userAnswer: string
    score: number
    scoreLevel: 'excellent' | 'good' | 'fair' | 'poor'
  }[]
}

const STORAGE_KEY = 'angrytutor-practice-records'

function loadRecords(): PracticeRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveRecords(records: PracticeRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export function getAllRecords(): PracticeRecord[] {
  return loadRecords().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function addRecord(record: Omit<PracticeRecord, 'id' | 'date' | 'percentage'>): PracticeRecord {
  const records = loadRecords()
  const newRecord: PracticeRecord = {
    ...record,
    id: `record-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
    percentage: Math.round((record.score / record.maxScore) * 100),
  }
  records.push(newRecord)
  saveRecords(records)
  return newRecord
}

export function clearAllRecords(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function getRecordsByScene(sceneId: string): PracticeRecord[] {
  return getAllRecords().filter(r => r.sceneId === sceneId)
}
