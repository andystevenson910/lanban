import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Column } from '../types'

interface Props {
  column: Column
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

export function ColumnHeader({ column, onRename, onDelete }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id, data: { type: 'column' } })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="col-header" {...attributes}>
      <span
        className="handle"
        {...listeners}
        title="Drag to reorder column"
        aria-label="Drag column"
      >
        ⋮⋮
      </span>
      <input
        className="name-input"
        value={column.name}
        onChange={(e) => onRename(column.id, e.target.value)}
        spellCheck={false}
        onPointerDown={(e) => e.stopPropagation()}
      />
      <button
        className="del-btn"
        onClick={() => onDelete(column.id)}
        title="Delete column"
        onPointerDown={(e) => e.stopPropagation()}
      >
        ×
      </button>
    </div>
  )
}

/** Rendered inside DragOverlay */
export function ColumnDragOverlay({ name }: { name: string }) {
  return (
    <div className="col-header col-header-dragging">
      <span className="handle">⋮⋮</span>
      <span className="name-input">{name}</span>
    </div>
  )
}
