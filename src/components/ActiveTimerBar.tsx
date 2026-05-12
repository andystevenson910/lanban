import { useEffect, useState } from 'react'
import type { ActiveTimer, Card } from '../types'
import { getCardColor } from '../colors'

interface Props {
  timer: ActiveTimer
  card: Card | undefined
  onStop: () => void
  onNoteChange: (note: string) => void
}

function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`
  if (m > 0) return `${m}m ${s % 60}s`
  return `${s}s`
}

export function ActiveTimerBar({ timer, card, onStop, onNoteChange }: Props) {
  const [now, setNow] = useState(Date.now())
  const [note, setNote] = useState(timer.note)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => { setNote(timer.note) }, [timer.note])

  const { bg } = getCardColor(card?.color)

  return (
    <div className="active-timer-bar">
      <div className="atb-dot" style={{ background: bg }} />
      <span className="atb-title">{card?.title ?? '(deleted)'}</span>
      <span className="atb-elapsed">{formatElapsed(now - timer.startedAt)}</span>
      <input
        className="atb-note"
        placeholder="Add a note…"
        value={note}
        onChange={(e) => {
          setNote(e.target.value)
          onNoteChange(e.target.value)
        }}
      />
      <button className="btn atb-stop" onClick={onStop}>■ Stop</button>
    </div>
  )
}
