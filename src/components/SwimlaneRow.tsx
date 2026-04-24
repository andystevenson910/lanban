import type { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Swimlane } from '../types'

interface Props {
  lane: Swimlane
  gridStyle: React.CSSProperties
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  children: ReactNode
}

export function SwimlaneRow({
  lane,
  gridStyle,
  onRename,
  onDelete,
  children,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lane.id, data: { type: 'swimlane' } })

  const style: React.CSSProperties = {
    ...gridStyle,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="lane-row" {...attributes}>
      <div className="lane-header">
        <span
          className="handle"
          {...listeners}
          title="Drag to reorder swimlane"
          aria-label="Drag swimlane"
        >
          ⋮⋮
        </span>
        <input
          className="name-input lane-name"
          value={lane.name}
          onChange={(e) => onRename(lane.id, e.target.value)}
          spellCheck={false}
          onPointerDown={(e) => e.stopPropagation()}
        />
        <button
          className="del-btn"
          onClick={() => onDelete(lane.id)}
          title="Delete swimlane"
          onPointerDown={(e) => e.stopPropagation()}
        >
          ×
        </button>
      </div>
      {children}
    </div>
  )
}

/** Rendered inside DragOverlay */
export function SwimlaneDragOverlay({ name }: { name: string }) {
  return (
    <div className="lane-header lane-header-dragging">
      <span className="handle">⋮⋮</span>
      <span>{name}</span>
    </div>
  )
}
