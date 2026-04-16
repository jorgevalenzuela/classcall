/**
 * SettingsPanel — pool mode toggle + data management (FR-06, FR-08).
 */

export default function SettingsPanel({
  roster, history, settings,
  resetPool, updateSettings, clearAll, clearGrades,
}) {
  function confirmClear(label, action) {
    if (window.confirm(`Clear ${label}? This cannot be undone.`)) action()
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
            onClick={() => updateSettings({ poolMode: 'session' })}
          >
            <span className="mode-icon">⏹</span>
            <span className="mode-name">Session reset</span>
            <span className="mode-desc">Pool stays empty until you reset manually.</span>
          </button>
          <button
            className={`mode-card ${settings.poolMode === 'roundrobin' ? 'mode-card-active' : ''}`}
            onClick={() => updateSettings({ poolMode: 'roundrobin' })}
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
