import { useEffect, useState } from 'react'
import type { Card, TimeEntry } from '../types'
import { getCardColor } from '../colors'

interface Props {
  entries: TimeEntry[]
  cards: Card[]
  onUpdate: (id: string, updates: Partial<TimeEntry>) => void
  onDelete: (id: string) => void
}

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatDuration(startedAt: number, endedAt: number) {
  const totalSeconds = Math.max(0, Math.floor((endedAt - startedAt) / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const hours = Math.floor(minutes / 60)
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${totalSeconds % 60}s`
  return `${totalSeconds}s`
}

function toDatetimeLocal(ms: number) {
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface RowProps {
  entry: TimeEntry
  card: Card | undefined
  onUpdate: (updates: Partial<TimeEntry>) => void
  onDelete: () => void
}

function TimeEntryRow({ entry, card, onUpdate, onDelete }: RowProps) {
  const [editing, setEditing] = useState<'title' | 'startedAt' | 'endedAt' | null>(null)
  const [draftTitle, setDraftTitle] = useState(entry.cardTitle)
  const [draftStart, setDraftStart] = useState('')
  const [draftEnd, setDraftEnd] = useState('')

  const [noteValue, setNoteValue] = useState(entry.note)
  const [noteFocused, setNoteFocused] = useState(false)

  // Keep note in sync when not focused
  useEffect(() => {
    if (!noteFocused) setNoteValue(entry.note)
  }, [entry.note, noteFocused])

  const { bg } = getCardColor(card?.color)

  function startEdit(field: 'title' | 'startedAt' | 'endedAt') {
    if (field === 'title') setDraftTitle(entry.cardTitle)
    if (field === 'startedAt') setDraftStart(toDatetimeLocal(entry.startedAt))
    if (field === 'endedAt') setDraftEnd(toDatetimeLocal(entry.endedAt))
    setEditing(field)
  }

  function commitTitle() {
    onUpdate({ cardTitle: draftTitle.trim() || entry.cardTitle })
    setEditing(null)
  }

  function commitStart() {
    const ms = new Date(draftStart).getTime()
    if (!isNaN(ms) && ms < entry.endedAt) onUpdate({ startedAt: ms })
    setEditing(null)
  }

  function commitEnd() {
    const ms = new Date(draftEnd).getTime()
    if (!isNaN(ms) && ms > entry.startedAt) onUpdate({ endedAt: ms })
    setEditing(null)
  }

  return (
    <div className="time-entry">
      <div className="te-dot" style={{ background: bg }} />

      <div className="te-title">
        {editing === 'title' ? (
          <input
            autoFocus
            className="te-edit-input"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => { if (e.key === 'Enter') commitTitle() }}
          />
        ) : (
          <span className="te-clickable" onClick={() => startEdit('title')} title="Click to edit">
            {entry.cardTitle}
          </span>
        )}
      </div>

      <div className="te-times">
        <span className="te-date">{formatDate(entry.startedAt)}</span>
        <span className="te-sep">·</span>
        {editing === 'startedAt' ? (
          <input
            type="datetime-local"
            autoFocus
            className="te-edit-input"
            value={draftStart}
            onChange={(e) => setDraftStart(e.target.value)}
            onBlur={commitStart}
          />
        ) : (
          <span className="te-clickable" onClick={() => startEdit('startedAt')} title="Click to edit">
            {formatTime(entry.startedAt)}
          </span>
        )}
        <span className="te-sep">–</span>
        {editing === 'endedAt' ? (
          <input
            type="datetime-local"
            autoFocus
            className="te-edit-input"
            value={draftEnd}
            onChange={(e) => setDraftEnd(e.target.value)}
            onBlur={commitEnd}
          />
        ) : (
          <span className="te-clickable" onClick={() => startEdit('endedAt')} title="Click to edit">
            {formatTime(entry.endedAt)}
          </span>
        )}
        <span className="te-sep">·</span>
        <span className="te-duration">{formatDuration(entry.startedAt, entry.endedAt)}</span>
      </div>

      <input
        className="te-note"
        placeholder="Quick note…"
        value={noteValue}
        onChange={(e) => setNoteValue(e.target.value)}
        onFocus={() => setNoteFocused(true)}
        onBlur={() => { setNoteFocused(false); onUpdate({ note: noteValue }) }}
      />

      <button className="te-delete" onClick={onDelete} title="Delete entry">×</button>
    </div>
  )
}

export function TimeLog({ entries, cards, onUpdate, onDelete }: Props) {
  const [newestFirst, setNewestFirst] = useState(true)

  if (entries.length === 0) return null

  const sorted = newestFirst ? [...entries].reverse() : entries

  return (
    <div className="time-log">
      <div className="time-log-heading">
        Time Log
        <button
          className="time-log-sort-btn"
          onClick={() => setNewestFirst((v) => !v)}
          title="Toggle sort order"
        >
          {newestFirst ? '↓ Newest first' : '↑ Oldest first'}
        </button>
      </div>
      {sorted.map((entry) => {
        const card = cards.find((c) => c.id === entry.cardId)
        return (
          <TimeEntryRow
            key={entry.id}
            entry={entry}
            card={card}
            onUpdate={(updates) => onUpdate(entry.id, updates)}
            onDelete={() => onDelete(entry.id)}
          />
        )
      })}
    </div>
  )
}
