/**
 * SettingsPanel — pool mode toggle, data management, classroom IP range (FR-06, FR-08).
 */

import { useState } from 'react'
import { apiFetch } from '../utils/apiClient'

export default function SettingsPanel({
  roster, history, settings, classId,
  resetPool, setPoolMode, clearAll, clearGrades,
}) {
  const [ipRange,    setIpRange]    = useState('')
  const [ipSaving,   setIpSaving]   = useState(false)
  const [ipSaved,    setIpSaved]    = useState(false)
  const [ipError,    setIpError]    = useState('')

  function confirmClear(label, action) {
    if (window.confirm(`Clear ${label}? This cannot be undone.`)) action()
  }

  async function saveIpRange() {
    if (!classId) return
    setIpSaving(true); setIpError(''); setIpSaved(false)
    try {
      await apiFetch(`/classes/${classId}/settings`, {
        method: 'PATCH',
        body: JSON.stringify({ allowed_ip_range: ipRange.trim() || null }),
      })
      setIpSaved(true)
      setTimeout(() => setIpSaved(false), 3000)
    } catch (e) {
      setIpError(e.message)
    } finally {
      setIpSaving(false)
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">Settings</h2>
      </div>

      {/* Pool mode (FR-08) */}
      <section className="settings-section">
        <h3 className="section-title">Pool mode</h3>
        <p className="section-desc">
          Controls what happens when every student in the roster has been called.
        </p>
        <div className="mode-cards">
          <button
            className={`mode-card ${settings.poolMode === 'session' ? 'mode-card-active' : ''}`}
            onClick={() => setPoolMode('session')}
          >
            <span className="mode-icon">⏹</span>
            <span className="mode-name">Session reset</span>
            <span className="mode-desc">Pool stays empty until you reset manually.</span>
          </button>
          <button
            className={`mode-card ${settings.poolMode === 'roundrobin' ? 'mode-card-active' : ''}`}
            onClick={() => setPoolMode('roundrobin')}
          >
            <span className="mode-icon">↻</span>
            <span className="mode-name">Round-robin</span>
            <span className="mode-desc">Pool auto-refills when all students are called.</span>
          </button>
        </div>
      </section>

      {/* Pool reset */}
      {roster.length > 0 && (
        <section className="settings-section">
          <h3 className="section-title">Pool</h3>
          <p className="section-desc">
            Reset the pool so all {roster.length} students become available again.
            Called history is cleared.
          </p>
          <button className="btn btn-secondary" onClick={resetPool}>
            Reset pool
          </button>
        </section>
      )}

      {/* Classroom IP range */}
      {classId && (
        <section className="settings-section">
          <h3 className="section-title">Allowed IP range (CIDR)</h3>
          <p className="section-desc">
            Students must be on this network to self-check-in. Leave blank to allow
            check-in from any network.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              className="text-input"
              style={{ maxWidth: 220 }}
              placeholder="192.168.1.0/24"
              value={ipRange}
              onChange={e => setIpRange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveIpRange()}
            />
            <button className="btn btn-secondary" disabled={ipSaving} onClick={saveIpRange}>
              {ipSaving ? 'Saving…' : ipSaved ? '✓ Saved' : 'Save'}
            </button>
          </div>
          {ipError && <p className="form-error" style={{ marginTop: '0.4rem' }}>{ipError}</p>}
          <p className="panel-sub" style={{ marginTop: '0.4rem' }}>
            Applied to new sessions. Existing session is not affected.
          </p>
        </section>
      )}

      {/* Data management */}
      <section className="settings-section">
        <h3 className="section-title">Data management</h3>
        <p className="section-desc">All data is stored locally in your browser.</p>
        <div className="danger-actions">
          {history.length > 0 && (
            <button
              className="btn btn-danger-outline"
              onClick={() => confirmClear('all grades and history', clearGrades)}
            >
              Clear grades &amp; history
            </button>
          )}
          {roster.length > 0 && (
            <button
              className="btn btn-danger"
              onClick={() => confirmClear('all ClassCall data (roster, grades, history)', clearAll)}
            >
              Clear all data
            </button>
          )}
        </div>
        {roster.length === 0 && history.length === 0 && (
          <p className="empty-state" style={{ marginTop: '0.5rem' }}>No data stored.</p>
        )}
      </section>
    </div>
  )
}
