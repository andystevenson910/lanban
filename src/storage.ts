import type { BoardData, MultiBoard, NamedBoard } from './types'

const KEY = 'kanban_v1'
const MULTI_KEY = 'kanban_multi_v1'
export const CURRENT_VERSION = 2

function migrate(raw: any): BoardData {
  const version: number = raw.version ?? 0

  if (version < 1) {
    raw.version = 1
  }

  if (version < 2) {
    raw.settings = raw.settings ?? { timeLogging: false }
    raw.activeTimer = raw.activeTimer ?? null
    raw.timeEntries = raw.timeEntries ?? []
    raw.version = 2
  }

  if (raw.activeTimer && raw.activeTimer.note === undefined) {
    raw.activeTimer.note = ''
  }

  return raw as BoardData
}

export const uid = (): string =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export function defaultBoard(): BoardData {
  const c1 = uid()
  const c2 = uid()
  const c3 = uid()
  const lane = uid()
  return {
    version: CURRENT_VERSION,
    settings: { timeLogging: false },
    activeTimer: null,
    timeEntries: [],
    columns: [
      { id: c1, name: 'To Do' },
      { id: c2, name: 'In Progress' },
      { id: c3, name: 'Done' },
    ],
    swimlanes: [{ id: lane, name: 'Lane 1' }],
    cards: [
      {
        id: uid(),
        columnId: c1,
        swimlaneId: lane,
        title: 'Welcome',
        subtitle: 'Click to edit',
        notes:
          'This is your kanban board. Drag columns, swimlanes, and cards to reorder them.\n\nPaste links like https://example.com or www.example.com — they become clickable when you click away.',
        color: 'yellow',
      },
    ],
  }
}

export function defaultMultiBoard(): MultiBoard {
  const id = uid()
  return {
    version: 1,
    activeId: id,
    boards: [{ id, name: 'Board 1', data: defaultBoard() } as NamedBoard],
  }
}

export function loadMultiBoard(): MultiBoard {
  try {
    const raw = localStorage.getItem(MULTI_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && Array.isArray(parsed.boards) && parsed.activeId) {
        parsed.boards = (parsed.boards as NamedBoard[]).map(b => ({ ...b, data: migrate(b.data) }))
        return parsed as MultiBoard
      }
    }
  } catch {}
  try {
    const legacyRaw = localStorage.getItem(KEY)
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw)
      if (parsed && Array.isArray(parsed.columns) && Array.isArray(parsed.swimlanes)) {
        const id = uid()
        return {
          version: 1,
          activeId: id,
          boards: [{ id, name: 'Board 1', data: migrate(parsed) }],
        }
      }
    }
  } catch {}
  return defaultMultiBoard()
}

export function saveMultiBoard(mb: MultiBoard): void {
  try {
    localStorage.setItem(MULTI_KEY, JSON.stringify(mb))
  } catch (err) {
    console.error('Failed to save', err)
  }
}

export function loadBoard(): BoardData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultBoard()
    const parsed = JSON.parse(raw)
    if (
      parsed &&
      Array.isArray(parsed.columns) &&
      Array.isArray(parsed.swimlanes) &&
      Array.isArray(parsed.cards)
    ) {
      return migrate(parsed)
    }
  } catch {
    // fall through
  }
  return defaultBoard()
}

export function saveBoard(data: BoardData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch (err) {
    console.error('Failed to save board', err)
  }
}

export function exportBoard(data: BoardData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `kanban-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function importBoard(): Promise<BoardData | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return resolve(null)
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result))
          if (
            !parsed ||
            !Array.isArray(parsed.columns) ||
            !Array.isArray(parsed.swimlanes) ||
            !Array.isArray(parsed.cards)
          ) {
            throw new Error('Invalid file format')
          }
          resolve(migrate(parsed))
        } catch (e) {
          alert('Failed to import: ' + (e as Error).message)
          resolve(null)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  })
}
