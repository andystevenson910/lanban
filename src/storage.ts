import type { BoardData } from './types'

const KEY = 'kanban_v1'

export const uid = (): string =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export function defaultBoard(): BoardData {
  const c1 = uid()
  const c2 = uid()
  const c3 = uid()
  const lane = uid()
  return {
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
      return parsed as BoardData
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
          resolve(parsed as BoardData)
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
