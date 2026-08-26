import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  MeasuringStrategy,
  PointerSensor,
  pointerWithin,
  closestCenter,
  rectIntersection,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { CollisionDetection } from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { BoardData, Card, MultiBoard, NamedBoard, Settings, TimeEntry } from './types'
import {
  defaultBoard,
  defaultMultiBoard,
  exportBoard,
  importBoard,
  loadMultiBoard,
  saveMultiBoard,
  uid,
} from './storage'
import { CARD_COLORS } from './colors'
import { ColumnHeader, ColumnDragOverlay } from './components/ColumnHeader'
import { SwimlaneRow, SwimlaneDragOverlay } from './components/SwimlaneRow'
import { Cell } from './components/Cell'
import { CardView, CardDragOverlay } from './components/CardView'
import { CardModal } from './components/CardModal'
import { SettingsModal } from './components/SettingsModal'
import { TimeLog } from './components/TimeLog'
import { ActiveTimerBar } from './components/ActiveTimerBar'

// Forgiving collision: prefer zones the pointer is inside, fall back to
// closest centre so you never have to hover over a precise spot.
const collisionDetection: CollisionDetection = (args) => {
  const inside = pointerWithin(args)
  if (inside.length > 0) return inside
  const rect = rectIntersection(args)
  if (rect.length > 0) return rect
  return closestCenter(args)
}

const _measureCanvas = document.createElement('canvas')
function measureColWidth(name: string, fontSize: number, letterSpacing: number, overhead: number): number {
  const ctx = _measureCanvas.getContext('2d')!
  ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`
  const textW = ctx.measureText(name.toUpperCase()).width + name.length * letterSpacing
  return Math.max(fontSize === 12 ? 180 : 260, Math.ceil(textW) + overhead)
}

export default function App() {
  const [multiBoard, setMultiBoard] = useState<MultiBoard>(() => loadMultiBoard())
  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [filterColors, setFilterColors] = useState<Set<string>>(new Set())

  const [dragging, setDragging] = useState<{ type: string; id: string } | null>(null)

  const activeBoard = multiBoard.boards.find(b => b.id === multiBoard.activeId) ?? multiBoard.boards[0]
  const data = activeBoard.data

  function setData(updater: BoardData | ((prev: BoardData) => BoardData)) {
    setMultiBoard(prev => {
      const cur = (prev.boards.find(b => b.id === prev.activeId) ?? prev.boards[0]).data
      const newData = typeof updater === 'function' ? updater(cur) : updater
      return {
        ...prev,
        boards: prev.boards.map(b => b.id === prev.activeId ? { ...b, data: newData } : b),
      }
    })
  }

  useEffect(() => {
    saveMultiBoard(multiBoard)
  }, [multiBoard])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const gridStyle = useMemo<React.CSSProperties>(() => {
    const laneColW = Math.max(180, ...data.swimlanes.map(l =>
      measureColWidth(l.name, 12, 0.8, 52)
    ))
    const colWs = data.columns.map(c => measureColWidth(c.name, 11, 1.2, 52))
    return { gridTemplateColumns: `${laneColW}px ${colWs.map(w => `${w}px`).join(' ')}` }
  }, [data.swimlanes, data.columns])

  const columnIds = useMemo(() => data.columns.map((c) => c.id), [data.columns])
  const swimlaneIds = useMemo(() => data.swimlanes.map((l) => l.id), [data.swimlanes])

  const headerScrollRef = useRef<HTMLDivElement>(null)
  const bodyScrollRef = useRef<HTMLDivElement>(null)

  function syncHeaderScroll(e: React.UIEvent<HTMLDivElement>) {
    if (headerScrollRef.current) headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft
  }

  function handleDragStart(event: DragStartEvent) {
    setDragging({
      type: String(event.active.data.current?.type ?? ''),
      id: String(event.active.id),
    })
  }

  function handleDragCancel() {
    setDragging(null)
  }

  // Live preview: move the card visually as you drag over cells/cards
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return
    const type = active.data.current?.type as string | undefined
    if (type !== 'card') return

    const activeCard = data.cards.find((c) => c.id === active.id)
    if (!activeCard) return

    const overType = over.data.current?.type as string | undefined

    if (overType === 'card') {
      if (active.id === over.id) return
      const overCard = data.cards.find((c) => c.id === over.id)
      if (!overCard) return

      const sameCell =
        activeCard.columnId === overCard.columnId &&
        activeCard.swimlaneId === overCard.swimlaneId

      if (sameCell) {
        const oldIdx = data.cards.findIndex((c) => c.id === active.id)
        const newIdx = data.cards.findIndex((c) => c.id === over.id)
        if (oldIdx < 0 || newIdx < 0 || oldIdx === newIdx) return
        setData((prev) => ({ ...prev, cards: arrayMove(prev.cards, oldIdx, newIdx) }))
        return
      }

      // Moving to a different cell — place next to the hovered card
      setData((prev) => {
        const remaining = prev.cards.filter((c) => c.id !== active.id)
        const updated: Card = {
          ...activeCard,
          columnId: overCard.columnId,
          swimlaneId: overCard.swimlaneId,
        }
        const insertIdx = remaining.findIndex((c) => c.id === overCard.id)
        remaining.splice(insertIdx < 0 ? remaining.length : insertIdx, 0, updated)
        return { ...prev, cards: remaining }
      })
      return
    }

    if (overType === 'cell') {
      const targetColumnId = (over.data.current as { columnId: string }).columnId
      const targetSwimlaneId = (over.data.current as { swimlaneId: string }).swimlaneId

      if (
        activeCard.columnId === targetColumnId &&
        activeCard.swimlaneId === targetSwimlaneId
      ) return

      setData((prev) => {
        const remaining = prev.cards.filter((c) => c.id !== active.id)
        const updated: Card = {
          ...activeCard,
          columnId: targetColumnId,
          swimlaneId: targetSwimlaneId,
        }
        let lastIdx = -1
        remaining.forEach((c, i) => {
          if (c.columnId === targetColumnId && c.swimlaneId === targetSwimlaneId) lastIdx = i
        })
        remaining.splice(lastIdx + 1, 0, updated)
        return { ...prev, cards: remaining }
      })
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setDragging(null)
    const { active, over } = event
    if (!over) return
    const type = active.data.current?.type as string | undefined

    if (type === 'column') {
      if (active.id === over.id) return
      const oldIdx = data.columns.findIndex((c) => c.id === active.id)
      const newIdx = data.columns.findIndex((c) => c.id === over.id)
      if (oldIdx < 0 || newIdx < 0) return
      setData((prev) => ({ ...prev, columns: arrayMove(prev.columns, oldIdx, newIdx) }))
      return
    }

    if (type === 'swimlane') {
      if (active.id === over.id) return
      const oldIdx = data.swimlanes.findIndex((l) => l.id === active.id)
      const newIdx = data.swimlanes.findIndex((l) => l.id === over.id)
      if (oldIdx < 0 || newIdx < 0) return
      setData((prev) => ({ ...prev, swimlanes: arrayMove(prev.swimlanes, oldIdx, newIdx) }))
      return
    }

    // Card drops are fully handled by onDragOver for live preview;
    // nothing extra needed here.
  }

  // --- board mutations ---
  function addColumn() {
    setData({ ...data, columns: [...data.columns, { id: uid(), name: 'New Column' }] })
  }

  function addSwimlane() {
    setData({ ...data, swimlanes: [...data.swimlanes, { id: uid(), name: 'New Lane' }] })
  }

  function renameColumn(id: string, name: string) {
    setData({ ...data, columns: data.columns.map((c) => (c.id === id ? { ...c, name } : c)) })
  }

  function renameSwimlane(id: string, name: string) {
    setData({ ...data, swimlanes: data.swimlanes.map((l) => (l.id === id ? { ...l, name } : l)) })
  }

  function deleteColumn(id: string) {
    const col = data.columns.find((c) => c.id === id)
    if (!col) return
    if (!confirm(`Delete column "${col.name}"? All cards in this column will be removed.`)) return
    setData({
      ...data,
      columns: data.columns.filter((c) => c.id !== id),
      cards: data.cards.filter((c) => c.columnId !== id),
    })
  }

  function deleteSwimlane(id: string) {
    const lane = data.swimlanes.find((l) => l.id === id)
    if (!lane) return
    if (!confirm(`Delete swimlane "${lane.name}"? All cards in this swimlane will be removed.`)) return
    setData({
      ...data,
      swimlanes: data.swimlanes.filter((l) => l.id !== id),
      cards: data.cards.filter((c) => c.swimlaneId !== id),
    })
  }

  function addCard(columnId: string, swimlaneId: string) {
    const newCard: Card = { id: uid(), columnId, swimlaneId, title: 'New card', subtitle: '', notes: '' }
    setData({ ...data, cards: [...data.cards, newCard] })
    setActiveCardId(newCard.id)
  }

  function updateCard(id: string, updates: Partial<Card>) {
    setData({ ...data, cards: data.cards.map((c) => (c.id === id ? { ...c, ...updates } : c)) })
  }

  function deleteCard(id: string) {
    setData({ ...data, cards: data.cards.filter((c) => c.id !== id) })
  }

  // --- timer ---
  function stopTimer(d: BoardData, now: number): Partial<BoardData> {
    if (!d.activeTimer) return {}
    const card = d.cards.find((c) => c.id === d.activeTimer!.cardId)
    const entry: TimeEntry = {
      id: uid(),
      cardId: d.activeTimer.cardId,
      cardTitle: card?.title ?? '(deleted)',
      startedAt: d.activeTimer.startedAt,
      endedAt: now,
      note: d.activeTimer.note,
    }
    return { activeTimer: null, timeEntries: [...d.timeEntries, entry] }
  }

  function handleToggleTimer(cardId: string) {
    const now = Date.now()
    if (data.activeTimer?.cardId === cardId) {
      setData({ ...data, ...stopTimer(data, now) })
    } else {
      const stopped = stopTimer(data, now)
      setData({
        ...data,
        ...stopped,
        timeEntries: stopped.timeEntries ?? data.timeEntries,
        activeTimer: { cardId, startedAt: now, note: '' },
      })
    }
  }

  function handleActiveTimerNoteChange(note: string) {
    if (!data.activeTimer) return
    setData({ ...data, activeTimer: { ...data.activeTimer, note } })
  }

  // --- settings ---
  function handleSaveSettings(s: Settings) {
    const now = Date.now()
    const stopped = !s.timeLogging && data.activeTimer ? stopTimer(data, now) : {}
    setData({ ...data, ...stopped, timeEntries: (stopped as any).timeEntries ?? data.timeEntries, settings: s })
  }

  // --- time entries ---
  function updateTimeEntry(id: string, updates: Partial<TimeEntry>) {
    setData({
      ...data,
      timeEntries: data.timeEntries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })
  }

  function deleteTimeEntry(id: string) {
    setData({ ...data, timeEntries: data.timeEntries.filter((e) => e.id !== id) })
  }

  // --- multi-board management ---
  function addBoard() {
    const id = uid()
    const newBoard: NamedBoard = { id, name: `Board ${multiBoard.boards.length + 1}`, data: defaultBoard() }
    setMultiBoard(prev => ({ ...prev, boards: [...prev.boards, newBoard], activeId: id }))
  }

  function cycleBoard(dir: 1 | -1) {
    setMultiBoard(prev => {
      const idx = prev.boards.findIndex(b => b.id === prev.activeId)
      const nextIdx = (idx + dir + prev.boards.length) % prev.boards.length
      return { ...prev, activeId: prev.boards[nextIdx].id }
    })
  }

  function renameBoard(id: string, name: string) {
    setMultiBoard(prev => ({
      ...prev,
      boards: prev.boards.map(b => b.id === id ? { ...b, name } : b),
    }))
  }

  function deleteBoard(id: string) {
    if (multiBoard.boards.length <= 1) return
    const board = multiBoard.boards.find(b => b.id === id)
    if (!confirm(`Delete board "${board?.name}"? All cards in this board will be removed.`)) return
    setMultiBoard(prev => {
      const remaining = prev.boards.filter(b => b.id !== id)
      const newActiveId = id === prev.activeId ? remaining[0].id : prev.activeId
      return { ...prev, boards: remaining, activeId: newActiveId }
    })
  }

  // --- import/reset ---
  async function handleImport() {
    const imported = await importBoard()
    if (imported && confirm('Replace this board with imported data?')) setData(imported)
  }

  function handleReset() {
    if (confirm('Reset this board to blank? This will delete all cards on this board.')) setData(defaultBoard())
  }

  // --- color filter ---
  function toggleColorFilter(colorId: string) {
    setFilterColors(prev => {
      const next = new Set(prev)
      if (next.has(colorId)) next.delete(colorId)
      else next.add(colorId)
      return next
    })
  }

  const activeCard = activeCardId ? data.cards.find((c) => c.id === activeCardId) ?? null : null

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-left">
          <h1>Kanban</h1>
          <button className="btn" onClick={addColumn}>+ Column</button>
          <button className="btn" onClick={addSwimlane}>+ Swimlane</button>
        </div>
        <div className="toolbar-center">
          <button
            className={`cf-all${filterColors.size === 0 ? ' cf-active' : ''}`}
            onClick={() => setFilterColors(new Set())}
          >All</button>
          {CARD_COLORS.map(c => (
            <button
              key={c.id}
              className={`cf-swatch${filterColors.has(c.id) ? ' cf-active' : ''}`}
              style={{ background: c.bg }}
              title={c.label}
              onClick={() => toggleColorFilter(c.id)}
            />
          ))}
        </div>
        <div className="toolbar-right">
          <button className="btn" onClick={() => exportBoard(data)} title="Download a backup JSON file">Export</button>
          <button className="btn" onClick={handleImport} title="Restore from a backup JSON file">Import</button>
          <button className="btn" onClick={() => setSettingsOpen(true)} title="Settings">⚙</button>
          <button className="btn btn-subtle" onClick={handleReset} title="Reset to a blank board">Reset</button>
        </div>
      </div>

      {data.settings.timeLogging && data.activeTimer && (() => {
        const timerCard = data.cards.find((c) => c.id === data.activeTimer!.cardId)
        return (
          <ActiveTimerBar
            timer={data.activeTimer}
            card={timerCard}
            onStop={() => setData({ ...data, ...stopTimer(data, Date.now()) })}
            onNoteChange={handleActiveTimerNoteChange}
          />
        )
      })()}

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        autoScroll={{ threshold: { x: 0.2, y: 0.2 }, speed: { x: 8, y: 12 } }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="board">
          <div className="board-header-scroll" ref={headerScrollRef}>
            <div className="header-row" style={gridStyle}>
              <div className="corner">
                <button
                  className="board-cycle"
                  onClick={() => cycleBoard(-1)}
                  title="Previous board"
                  style={{ visibility: multiBoard.boards.length <= 1 ? 'hidden' : 'visible' }}
                >‹</button>
                <input
                  className="name-input"
                  value={activeBoard.name}
                  onChange={(e) => renameBoard(multiBoard.activeId, e.target.value)}
                  spellCheck={false}
                  onPointerDown={(e) => e.stopPropagation()}
                  title="Board name"
                />
                <button
                  className="board-cycle"
                  onClick={() => cycleBoard(1)}
                  title="Next board"
                  style={{ visibility: multiBoard.boards.length <= 1 ? 'hidden' : 'visible' }}
                >›</button>
                <button
                  className="board-cycle"
                  onClick={addBoard}
                  title="Add new board"
                >+</button>
                {multiBoard.boards.length > 1 && (
                  <button
                    className="del-btn"
                    onClick={() => deleteBoard(multiBoard.activeId)}
                    title="Delete this board"
                    onPointerDown={(e) => e.stopPropagation()}
                  >×</button>
                )}
              </div>
              <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
                {data.columns.map((col) => (
                  <ColumnHeader key={col.id} column={col} onRename={renameColumn} onDelete={deleteColumn} />
                ))}
              </SortableContext>
            </div>
          </div>

          <div className="board-scroll" ref={bodyScrollRef} onScroll={syncHeaderScroll}>
            <div className="board-inner">
            <SortableContext items={swimlaneIds} strategy={verticalListSortingStrategy}>
              {data.swimlanes.map((lane, i) => (
                <><div className={i === 0 ? 'lane-divider lane-divider-first' : 'lane-divider'} />
                <SwimlaneRow
                  key={lane.id}
                  lane={lane}
                  gridStyle={gridStyle}
                  onRename={renameSwimlane}
                  onDelete={deleteSwimlane}
                >
                  {data.columns.map((col) => {
                    const cellCards = data.cards.filter(
                      (c) => c.columnId === col.id && c.swimlaneId === lane.id &&
                        (filterColors.size === 0 || filterColors.has(c.color ?? 'yellow')),
                    )
                    return (
                      <Cell key={col.id} columnId={col.id} swimlaneId={lane.id} onAddCard={addCard}>
                        <SortableContext items={cellCards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                          {cellCards.map((card) => (
                            <CardView
                              key={card.id}
                              card={card}
                              onOpen={setActiveCardId}
                              timeLogging={data.settings.timeLogging}
                              isTimerActive={data.activeTimer?.cardId === card.id}
                              onToggleTimer={handleToggleTimer}
                            />
                          ))}
                        </SortableContext>
                      </Cell>
                    )
                  })}
                </SwimlaneRow></>
              ))}
            </SortableContext>
            </div>
          </div>
        </div>

        <DragOverlay
          dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}
        >
          {dragging?.type === 'card' && (() => {
            const card = data.cards.find((c) => c.id === dragging.id)
            return card ? <CardDragOverlay card={card} /> : null
          })()}
          {dragging?.type === 'column' && (() => {
            const col = data.columns.find((c) => c.id === dragging.id)
            return col ? <ColumnDragOverlay name={col.name} /> : null
          })()}
          {dragging?.type === 'swimlane' && (() => {
            const lane = data.swimlanes.find((l) => l.id === dragging.id)
            return lane ? <SwimlaneDragOverlay name={lane.name} /> : null
          })()}
        </DragOverlay>
      </DndContext>

      {data.settings.timeLogging && (
        <TimeLog
          entries={data.timeEntries}
          cards={data.cards}
          onUpdate={updateTimeEntry}
          onDelete={deleteTimeEntry}
        />
      )}

      {activeCard && (
        <CardModal
          card={activeCard}
          onSave={(updates) => updateCard(activeCard.id, updates)}
          onDelete={() => deleteCard(activeCard.id)}
          onClose={() => setActiveCardId(null)}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          settings={data.settings}
          onSave={handleSaveSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </>
  )
}
