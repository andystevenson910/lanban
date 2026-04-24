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
  color?: string // id from CARD_COLORS, defaults to 'yellow'
}

export interface BoardData {
  columns: Column[]
  swimlanes: Swimlane[]
  cards: Card[]
}
