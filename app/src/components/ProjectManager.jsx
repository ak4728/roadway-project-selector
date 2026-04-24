import { useContext, useState, useRef } from 'react'
import * as turf from '@turf/turf'
import { ProjectContext } from '../store/ProjectContext'
import { calcStats, exportGeoJSON, exportCSV, exportAllProjectsJSON } from '../utils/stats'

export default function ProjectManager() {
  const { state, dispatch } = useContext(ProjectContext)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const importRef = useRef(null)

  const bufferFt = state.bufferFt

  const activeProject = state.projects.find(p => p.id === state.activeProjectId)

  const handleCreate = () => {
    const name = newName.trim() || `Project ${state.projects.length + 1}`
    dispatch({ type: 'CREATE_PROJECT', payload: name })
    setNewName('')
  }

  const handleRename = (id) => {
    const trimmed = editingName.trim()
    if (trimmed) dispatch({ type: 'RENAME_PROJECT', payload: { id, name: trimmed } })
    setEditingId(null)
    setEditingName('')
  }

  const handleConfirm = () => {
    const effectiveIds = [
      ...state.pendingLinkIds,
      ...(state.autoSuggest ? state.suggestedLinkIds : []),
    ]
    if (!effectiveIds.length) return
    const features = state.links.filter(f => effectiveIds.includes(f.id))
    const fc = { type: 'FeatureCollection', features }
    let buffer = null
    try {
      const buffered = turf.buffer(fc, state.bufferFt, { units: 'feet' })
      const polys = buffered.features
      buffer = polys.length === 1 ? polys[0] : polys.reduce((acc, f) => turf.union(acc, f))
    } catch (e) { /* ignore */ }
    dispatch({ type: 'CONFIRM_PROJECT', payload: { buffer, linkIds: effectiveIds } })
  }

  const handleImportFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (data.version === 1 && Array.isArray(data.projects)) {
          dispatch({ type: 'IMPORT_PROJECTS', payload: data.projects })
        } else {
          alert('Invalid project file format.')
        }
      } catch { alert('Could not parse file.') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const listedProjects = state.projects.filter(p => p.id !== state.activeProjectId)
  const confirmedProjects = state.projects.filter(p => p.confirmed)

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="section-title" style={{ color: activeProject.color, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              ●{' '}
              {editingId === activeProject.id
                ? <input autoFocus value={editingName} onChange={e => setEditingName(e.target.value)}
                    onBlur={() => handleRename(activeProject.id)}
                    onKeyDown={e => { if (e.key === 'Enter') handleRename(activeProject.id); if (e.key === 'Escape') setEditingId(null) }}
                    style={{ fontSize: 12, width: 120, padding: '1px 4px' }} />
                : <span>{activeProject.name}</span>
              }
              <button className="btn-ghost" style={{ fontSize: 10, padding: '1px 5px' }}
                onClick={() => { setEditingId(activeProject.id); setEditingName(activeProject.name) }}>✎</button>
            </div>
            <button className="btn-danger" style={{ fontSize: 10, padding: '3px 7px' }}
              onClick={() => dispatch({ type: 'DELETE_PROJECT', payload: activeProject.id })}>
              ✕ Delete
            </button>
          </div>
          <div style={{ color: '#aaa', fontSize: 11, marginBottom: 8, marginTop: 6 }}>
            <span style={{ color: '#00E5FF' }}>{state.pendingLinkIds.length} manual</span>
            {state.autoSuggest && state.suggestedLinkIds.length > 0 && (
              <span style={{ color: '#c084fc', marginLeft: 6 }}>+ {state.suggestedLinkIds.length} auto</span>
            )}
            <span style={{ color: '#666', marginLeft: 6 }}>— click links on map</span>
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

          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            <button className="btn-ghost" onClick={() => dispatch({ type: 'UNDO_LAST' })}
              disabled={!state.pendingLinkIds.length}>
              ↩ Undo
            </button>
            <button className="btn-ghost" onClick={() => dispatch({ type: 'CLEAR_SELECTION' })}
              disabled={!state.pendingLinkIds.length}>
              ✕ Clear
            </button>
            {state.pendingLinkIds.length > 0 && (
              <button className="btn-ghost"
                onClick={() => dispatch({ type: 'SET_ZOOM_TARGET', payload: activeProject.id })}>
                ⌖ Zoom
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
            <label style={{ fontSize: 11, color: '#aaa', display: 'flex', alignItems: 'center', gap: 4 }}>
              Buffer:
              <input
                type="number"
                value={bufferFt}
                min={50} max={5000}
                onChange={e => dispatch({ type: 'SET_BUFFER_FT', payload: Number(e.target.value) })}
                style={{ width: 65 }}
              />
              ft
            </label>
            <label style={{ fontSize: 11, color: state.autoSuggest ? '#c084fc' : '#666', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={state.autoSuggest}
                onChange={e => dispatch({ type: 'SET_AUTO_SUGGEST', payload: e.target.checked })}
                style={{ accentColor: '#c084fc' }}
              />
              Auto-suggest
            </label>
          </div>

          <button className="btn-success" style={{ width: '100%' }}
            onClick={handleConfirm}
            disabled={!state.pendingLinkIds.length && !(state.autoSuggest && state.suggestedLinkIds.length)}>
            ✓ Confirm Project
          </button>
        </div>
      )}

      {/* Project list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f3460', padding: '0 8px 0 0' }}>
          <div className="panel-header" style={{ fontSize: 10 }}>All Projects</div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn-ghost" style={{ fontSize: 10, padding: '3px 7px' }}
              onClick={() => importRef.current.click()}>
              ↑ Import
            </button>
            <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />
            {confirmedProjects.length > 0 && (
              <button className="btn-ghost" style={{ fontSize: 10, padding: '3px 7px' }}
                onClick={() => exportAllProjectsJSON(confirmedProjects)}>
                ↓ All
              </button>
            )}
            {state.projects.length > 0 && (
              <button className="btn-danger" style={{ fontSize: 10, padding: '3px 7px' }}
                onClick={() => { if (window.confirm('Reset all projects?')) dispatch({ type: 'RESET_ALL' }) }}>
                ↺ Reset
              </button>
            )}
          </div>
        </div>

        {listedProjects.map(p => {
          const stats = calcStats(state.links, p.linkIds)
          return (
            <div key={p.id} className="project-item"
              style={{ cursor: p.linkIds.length ? 'pointer' : 'default' }}
              onClick={() => p.linkIds.length && dispatch({ type: 'SET_ZOOM_TARGET', payload: p.id })}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={e => e.stopPropagation()}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="project-dot" style={{ background: p.color }} />
                  {editingId === p.id
                    ? <input autoFocus value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onBlur={() => handleRename(p.id)}
                        onKeyDown={e => { if (e.key === 'Enter') handleRename(p.id); if (e.key === 'Escape') setEditingId(null) }}
                        style={{ fontSize: 12, width: 110, padding: '1px 4px' }} />
                    : <b>{p.name}</b>
                  }
                  {!p.confirmed && <span style={{ fontSize: 9, color: '#e94560', marginLeft: 2 }}>pending</span>}
                  <button className="btn-ghost" style={{ fontSize: 10, padding: '1px 4px' }}
                    onClick={e => { e.stopPropagation(); setEditingId(p.id); setEditingName(p.name) }}>✎</button>
                </span>
                <span style={{ color: '#666', fontSize: 11 }}>{p.linkIds.length} seg</span>
              </div>
              {stats && (
                <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                  {stats.totalLength_mi.toFixed(2)} mi · Avg PCI {stats.avgPCI.toFixed(0)} · ${Math.round(stats.totalResurf).toLocaleString()}
                </div>
              )}
              <div style={{ display: 'flex', gap: 4, marginTop: 6 }} onClick={e => e.stopPropagation()}>
                {p.confirmed && (
                  <>
                    <button className="btn-ghost" style={{ fontSize: 10, padding: '3px 7px' }}
                      onClick={e => { e.stopPropagation(); dispatch({ type: 'EDIT_PROJECT', payload: p.id }) }}>
                      ✎ Edit
                    </button>
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
                  </>
                )}
                {!p.confirmed && (
                  <button className="btn-ghost" style={{ fontSize: 10, padding: '3px 7px' }}
                    onClick={() => dispatch({ type: 'SET_ACTIVE_PROJECT', payload: p.id })}>
                    Resume
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
        {!listedProjects.length && (
          <div style={{ padding: 14, color: '#555', fontSize: 11 }}>
            {state.activeProjectId ? 'No other projects yet.' : 'No projects yet.'}
          </div>
        )}
      </div>
    </div>
  )
}
