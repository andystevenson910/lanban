import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Card } from '../types'
import { getCardColor } from '../colors'

interface Props {
  card: Card
  onOpen: (id: string) => void
  timeLogging?: boolean
  isTimerActive?: boolean
  onToggleTimer?: (id: string) => void
}

function cardRotation(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff
  return ((h % 500) - 250) / 125
}

export function CardView({ card, onOpen, timeLogging, isTimerActive, onToggleTimer }: Props) {
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
  const isRainbow = card.color === 'rainbow'
  const rotation = cardRotation(card.id)

  const style: React.CSSProperties = {
    transform: transform
      ? `${CSS.Transform.toString(transform)} rotate(${rotation}deg)`
      : `rotate(${rotation}deg)`,
    transition,
    opacity: isDragging ? 0 : 1,
    pointerEvents: isDragging ? 'none' : undefined,
    background: isRainbow ? undefined : bg,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card${isTimerActive ? ' card-timer-active' : ''}${isRainbow ? ' card-rainbow' : ''}`}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!isDragging) onOpen(card.id)
      }}
    >
      {timeLogging && (
        <button
          className={`card-timer-btn${isTimerActive ? ' card-timer-btn-active' : ''}`}
          title={isTimerActive ? 'Stop timer' : 'Start timer'}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onToggleTimer?.(card.id)
          }}
        >
          {isTimerActive ? '■' : '▶'}
        </button>
      )}
      <div className="card-title">{card.title || '(untitled)'}</div>
      {card.subtitle && <div className="card-subtitle">{card.subtitle}</div>}
    </div>
  )
}

export function CardDragOverlay({ card }: { card: Card }) {
  const { bg } = getCardColor(card.color)
  const isRainbow = card.color === 'rainbow'
  return (
    <div
      className={`card card-dragging${isRainbow ? ' card-rainbow' : ''}`}
      style={{ background: isRainbow ? undefined : bg }}
    >
      <div className="card-title">{card.title || '(untitled)'}</div>
      {card.subtitle && <div className="card-subtitle">{card.subtitle}</div>}
    </div>
  )
}
