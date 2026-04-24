import { useEffect, useRef, useState } from 'react'
import type { Card } from '../types'
import { CARD_COLORS, DEFAULT_COLOR, getCardColor } from '../colors'

interface Props {
  card: Card
  onSave: (updates: Partial<Card>) => void
  onDelete: () => void
  onClose: () => void
}

type Segment = { kind: 'text'; value: string } | { kind: 'link'; href: string; display: string }

// Matches https?:// URLs and bare www. URLs
const LINK_RE = /(?:(?:https?|ftp):\/\/|www\.)[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]+/g

function linkify(text: string): Segment[] {
  const out: Segment[] = []
  let lastIdx = 0
  LINK_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = LINK_RE.exec(text)) !== null) {
    if (m.index > lastIdx) {
      out.push({ kind: 'text', value: text.slice(lastIdx, m.index) })
    }
    const raw = m[0]
    const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    out.push({ kind: 'link', href, display: raw })
    lastIdx = m.index + raw.length
  }
  if (lastIdx < text.length) {
    out.push({ kind: 'text', value: text.slice(lastIdx) })
  }
  return out
}

export function CardModal({ card, onSave, onDelete, onClose }: Props) {
  const [title, setTitle] = useState(card.title)
  const [subtitle, setSubtitle] = useState(card.subtitle)
  const [notes, setNotes] = useState(card.notes)
  const [color, setColor] = useState(card.color ?? DEFAULT_COLOR)
  const [notesEditing, setNotesEditing] = useState(false)
  const notesRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setTitle(card.title)
    setSubtitle(card.subtitle)
    setNotes(card.notes)
    setColor(card.color ?? DEFAULT_COLOR)
    setNotesEditing(false)
  }, [card.id])

  useEffect(() => {
    if (notesEditing && notesRef.current) {
      notesRef.current.focus()
      const len = notesRef.current.value.length
      notesRef.current.setSelectionRange(len, len)
    }
  }, [notesEditing])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (notesEditing) setNotesEditing(false)
        else onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, notesEditing])

  function save() {
    onSave({ title: title.trim() || '(untitled)', subtitle: subtitle.trim(), notes, color })
    onClose()
  }

  function handleDelete() {
    if (confirm('Delete this card?')) { onDelete(); onClose() }
  }

  const { bg } = getCardColor(color)
  const segments = linkify(notes)
  const hasNotes = notes.trim().length > 0

  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="modal" role="dialog" aria-modal="true">
        {/* Color stripe at top, matches the card */}
        <div className="modal-stripe" style={{ background: bg }} />

        <input
          className="modal-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          autoFocus
        />
        <input
          className="modal-subtitle"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Subtitle"
        />

        {/* Color picker */}
        <div className="color-picker">
          {CARD_COLORS.map((c) => (
            <button
              key={c.id}
              className={`color-swatch${color === c.id ? ' swatch-selected' : ''}`}
              style={{ background: c.bg }}
              onClick={() => setColor(c.id)}
              title={c.label}
              type="button"
            />
          ))}
        </div>

        <div className="notes-label">Notes</div>

        {notesEditing ? (
          <textarea
            ref={notesRef}
            className="modal-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => setNotesEditing(false)}
            placeholder="Type notes… www.example.com and https://… become clickable when you click away."
          />
        ) : (
          <div
            className={`notes-view${!hasNotes ? ' notes-empty' : ''}`}
            onClick={() => setNotesEditing(true)}
            title="Click to edit"
          >
            {hasNotes ? (
              segments.map((seg, i) =>
                seg.kind === 'link' ? (
                  <a
                    key={i}
                    href={seg.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {seg.display}
                  </a>
                ) : (
                  <span key={i}>{seg.value}</span>
                ),
              )
            ) : (
              <span className="notes-placeholder">Click to add notes…</span>
            )}
          </div>
        )}

        <div className="modal-buttons">
          <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save</button>
        </div>
      </div>
    </>
  )
}
