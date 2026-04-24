import { useContext, useState } from 'react'
import * as turf from '@turf/turf'
import { ProjectContext } from '../store/ProjectContext'
import { calcStats, exportGeoJSON, exportCSV } from '../utils/stats'

export default function ProjectManager() {
  const { state, dispatch } = useContext(ProjectContext)
  const [newName, setNewName] = useState('')
  const [bufferMeters, setBufferMeters] = useState(50)

  const activeProject = state.projects.find(p => p.id === state.activeProjectId)

  const handleCreate = () => {
    const name = newName.trim() || `Project ${state.projects.length + 1}`
    dispatch({ type: 'CREATE_PROJECT', payload: name })
    setNewName('')
  }

  const handleConfirm = () => {
    if (!state.pendingLinkIds.length) return
    const features = state.links.filter(f => state.pendingLinkIds.includes(f.id))
    const fc = { type: 'FeatureCollection', features }
    let buffer = null
    try { buffer = turf.buffer(fc, bufferMeters, { units: 'meters' }) } catch (e) { /* ignore */ }
    dispatch({ type: 'CONFIRM_PROJECT', payload: { buffer } })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-header">Project Manager</div>

      {/* Create project */}
      <div className="section">
        <div className="section-title">New Project</div>
        <input
          type="text"
          placeholder={`Project ${state.projects.length + 1}`}
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
        />
        <button className="btn-primary" style={{ marginTop: 8, width: '100%' }} onClick={handleCreate}>
          + Create Project
        </button>
      </div>

      {/* Active project controls */}
      {activeProject && (
        <div className="section" style={{ background: '#0f3460' }}>
          <div className="section-title" style={{ color: activeProject.color }}>
            ● Active: {activeProject.name}
          </div>
          <div style={{ color: '#aaa', fontSize: 11, marginBottom: 8 }}>
            {state.pendingLinkIds.length} segment(s) selected — click links on map
          </div>

          {/* Selected link chips */}
          <div style={{ marginBottom: 8, maxHeight: 100, overflowY: 'auto' }}>
            {state.pendingLinkIds.map(lid => {
              const feat = state.links.find(f => f.id === lid)
              const label = feat?.properties?.STREET || `Link ${lid}`
              return (
                <span key={lid} className="link-chip">
                  {label}
                  <button onClick={() => dispatch({ type: 'TOGGLE_LINK', payload: lid })}>×</button>
                </span>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <button className="btn-ghost" onClick={() => dispatch({ type: 'UNDO_LAST' })}
              disabled={!state.pendingLinkIds.length}>
              ↩ Undo
            </button>
            <label style={{ fontSize: 11, color: '#aaa', display: 'flex', alignItems: 'center', gap: 4 }}>
              Buffer:
              <input
                type="number"
                value={bufferMeters}
                min={10} max={500}
                onChange={e => setBufferMeters(Number(e.target.value))}
                style={{ width: 55 }}
              />
              m
            </label>
          </div>

          <button className="btn-success" style={{ width: '100%' }}
            onClick={handleConfirm} disabled={!state.pendingLinkIds.length}>
            ✓ Confirm Project
          </button>
        </div>
      )}

      {/* Project list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div className="panel-header" style={{ fontSize: 10 }}>Completed Projects</div>
        {state.projects.filter(p => p.confirmed).map(p => {
          const stats = calcStats(state.links, p.linkIds)
          return (
            <div key={p.id} className="project-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  <span className="project-dot" style={{ background: p.color }} />
                  <b>{p.name}</b>
                </span>
                <span style={{ color: '#666', fontSize: 11 }}>{p.linkIds.length} seg</span>
              </div>
              {stats && (
                <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                  {stats.totalLength_mi.toFixed(2)} mi · Avg PCI {stats.avgPCI.toFixed(0)} · ${Math.round(stats.totalResurf).toLocaleString()}
                </div>
              )}
              <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                <button className="btn-ghost" style={{ fontSize: 10, padding: '3px 7px' }}
                  onClick={() => exportGeoJSON(state.links, p.linkIds, p.name)}>
                  GeoJSON
                </button>
                {stats && (
                  <button className="btn-ghost" style={{ fontSize: 10, padding: '3px 7px' }}
                    onClick={() => exportCSV(stats, p.name)}>
                    CSV
                  </button>
                )}
                <button className="btn-danger" style={{ fontSize: 10, padding: '3px 7px', marginLeft: 'auto' }}
                  onClick={() => dispatch({ type: 'DELETE_PROJECT', payload: p.id })}>
                  ✕
                </button>
              </div>
            </div>
          )
        })}
        {!state.projects.filter(p => p.confirmed).length && (
          <div style={{ padding: 14, color: '#555', fontSize: 11 }}>
            No confirmed projects yet.
          </div>
        )}
      </div>
    </div>
  )
}
