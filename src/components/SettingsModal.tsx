import { useEffect, useState } from 'react'
import type { Settings } from '../types'

interface Props {
  settings: Settings
  onSave: (s: Settings) => void
  onClose: () => void
}

export function SettingsModal({ settings, onSave, onClose }: Props) {
  const [s, setS] = useState<Settings>({ ...settings })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="modal settings-modal" role="dialog" aria-modal="true">
        <div className="settings-header">
          <span>Settings</span>
          <button className="settings-close" onClick={onClose}>×</button>
        </div>

        <div className="settings-body">
          <div className="settings-row">
            <div className="settings-info">
              <div className="settings-label">Time Logging</div>
              <div className="settings-desc">Track time spent on cards with a per-card timer</div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={s.timeLogging}
                onChange={(e) => setS({ ...s, timeLogging: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        <div className="settings-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { onSave(s); onClose() }}>Save</button>
        </div>
      </div>
    </>
  )
}
