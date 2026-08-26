export type ID = string

export interface Column {
  id: ID
  name: string
}

export interface Swimlane {
  id: ID
  name: string
}

export interface Card {
  id: ID
  columnId: ID
  swimlaneId: ID
  title: string
  subtitle: string
  notes: string
  color?: string
}

export interface Settings {
  timeLogging: boolean
}

export interface TimeEntry {
  id: ID
  cardId: ID
  cardTitle: string
  startedAt: number
  endedAt: number
  note: string
}

export interface ActiveTimer {
  cardId: ID
  startedAt: number
  note: string
}

export interface BoardData {
  version: number
  settings: Settings
  activeTimer: ActiveTimer | null
  columns: Column[]
  swimlanes: Swimlane[]
  cards: Card[]
  timeEntries: TimeEntry[]
}

export interface NamedBoard {
  id: ID
  name: string
  data: BoardData
}

export interface MultiBoard {
  version: number
  activeId: ID
  boards: NamedBoard[]
}
