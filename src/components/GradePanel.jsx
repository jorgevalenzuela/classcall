/**
 * GradePanel — instructor-only grade history + re-grade interface (FR-05, FR-10).
 *
 * Score input: continuous 0.0–5.0 slider (step 0.1) via @radix-ui/react-slider.
 * This tab is hidden from students (controlled by App.jsx instructorMode).
 */

import { useState } from 'react'
import * as Slider from '@radix-ui/react-slider'
import { LIKERT_COLORS, getAvgScore } from '../utils/scoring'

function fmt(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function sliderColor(value) {
  if (value >= 4.5) return LIKERT_COLORS[5]
  if (value >= 3.5) return LIKERT_COLORS[4]
  if (value >= 2.5) return LIKERT_COLORS[3]
  if (value >= 1.5) return LIKERT_COLORS[2]
  return LIKERT_COLORS[1]
}

export default function GradePanel({ roster, grades, history, selected, recordGrade }) {
  const [sliderValue, setSliderValue] = useState(3.0)
  const color = sliderColor(sliderValue)

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Grade</h2>
          <p className="panel-sub">Instructor view · private</p>
        </div>
        <span className="badge badge-warning">🔒 Instructor only</span>
      </div>

      {/* Currently selected student */}
      {selected ? (
        <div className="grade-card">
          <p className="grade-card-label">
            {selected.type === 'volunteer' ? '🙋 Volunteer' : '🎲 Random'} — grade now:
          </p>
          <p className="grade-card-name">{selected.name}</p>

          <div className="slider-wrap">
            <Slider.Root
              className="slider-root"
              min={0}
              max={5}
              step={0.1}
              value={[sliderValue]}
              onValueChange={([v]) => setSliderValue(v)}
            >
              <Slider.Track className="slider-track">
                <Slider.Range className="slider-range" style={{ backgroundColor: color }} />
              </Slider.Track>
              <Slider.Thumb className="slider-thumb" style={{ borderColor: color }} />
            </Slider.Root>
            <span className="slider-readout" style={{ color }}>{sliderValue.toFixed(1)}</span>
          </div>

          <button
            className="btn btn-primary"
            style={{ marginTop: '0.75rem' }}
            onClick={() => { recordGrade(selected.id, sliderValue); setSliderValue(3.0) }}
          >
            Record {sliderValue.toFixed(1)}
          </button>
        </div>
      ) : (
        <div className="empty-state" style={{ marginBottom: '1.5rem' }}>
          No student selected. Use the <strong>Call</strong> tab to select one.
        </div>
      )}

      {/* Per-student grade summary */}
      {roster.length > 0 && (
        <div>
          <h3 className="section-title">Student averages</h3>
          <div className="grade-summary-grid">
            {roster.map(student => {
              const g = grades[student.id] || []
              const avg = getAvgScore(g)
              return (
                <div key={student.id} className="grade-summary-row">
                  <span className="gs-name">{student.name}</span>
                  <span className="gs-count">{g.length} grade{g.length !== 1 ? 's' : ''}</span>
                  {avg !== null ? (
                    <span className="gs-avg" style={{ color: sliderColor(avg) }}>
                      {avg.toFixed(1)}
                    </span>
                  ) : (
                    <span className="gs-avg gs-none">—</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Session history */}
      {history.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <h3 className="section-title">Session history</h3>
          <div className="history-list">
            {history.map((entry, i) => (
              <div key={i} className="history-row">
                <span className="hist-time">{fmt(entry.ts)}</span>
                <span className={`hist-type ${entry.type === 'volunteer' ? 'type-v' : 'type-r'}`}>
                  {entry.type === 'volunteer' ? '🙋' : '🎲'}
                </span>
                <span className="hist-name">{entry.name}</span>
                <span
                  className="hist-score"
                  style={{ color: sliderColor(entry.score) }}
                >
                  {typeof entry.score === 'number' ? entry.score.toFixed(1) : entry.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length === 0 && roster.length === 0 && (
        <div className="empty-state">No grades yet this session.</div>
      )}
    </div>
  )
}
