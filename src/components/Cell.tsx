import type { ReactNode } from 'react'
import { useDroppable } from '@dnd-kit/core'

interface Props {
  columnId: string
  swimlaneId: string
  onAddCard: (columnId: string, swimlaneId: string) => void
  children: ReactNode
}

export function Cell({ columnId, swimlaneId, onAddCard, children }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell:${columnId}:${swimlaneId}`,
    data: { type: 'cell', columnId, swimlaneId },
  })

  return (
    <div
      ref={setNodeRef}
      className={`cell${isOver ? ' cell-over' : ''}`}
    >
      <div className="cell-cards">{children}</div>
      <button
        className="add-card"
        onClick={() => onAddCard(columnId, swimlaneId)}
        title="Add card"
      >
        +
      </button>
    </div>
  )
}
