import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Card } from '../types'
import { getCardColor } from '../colors'

interface Props {
  card: Card
  onOpen: (id: string) => void
}

/** Deterministic small rotation from card id so it's consistent on re-render. */
function cardRotation(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff
  return ((h % 500) - 250) / 125 // –2 to +2 deg
}

export function CardView({ card, onOpen }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      columnId: card.columnId,
      swimlaneId: card.swimlaneId,
    },
  })

  const { bg } = getCardColor(card.color)

  const rotation = cardRotation(card.id)
  const baseTransform = `rotate(${rotation}deg)`

  const style: React.CSSProperties = {
    transform: transform
      ? `${CSS.Transform.toString(transform)} rotate(${rotation}deg)`
      : baseTransform,
    transition,
    opacity: isDragging ? 0 : 1,
    pointerEvents: isDragging ? 'none' : undefined,
    background: bg,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="card"
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!isDragging) onOpen(card.id)
      }}
    >
      <div className="card-title">{card.title || '(untitled)'}</div>
      {card.subtitle && <div className="card-subtitle">{card.subtitle}</div>}
    </div>
  )
}

/** Rendered inside DragOverlay — no listeners, just visuals. */
export function CardDragOverlay({ card }: { card: Card }) {
  const { bg } = getCardColor(card.color)
  return (
    <div className="card card-dragging" style={{ background: bg }}>
      <div className="card-title">{card.title || '(untitled)'}</div>
      {card.subtitle && <div className="card-subtitle">{card.subtitle}</div>}
    </div>
  )
}
