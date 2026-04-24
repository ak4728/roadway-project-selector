import React, { useEffect, useReducer } from 'react'
import MapView from './components/MapView'
import ProjectManager from './components/ProjectManager'
import SummaryPanel from './components/SummaryPanel'
import { ProjectContext, initialState, reducer } from './store/ProjectContext'

const STORAGE_KEY = 'roadway-project-state'

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Load GeoJSON, then restore any saved state
  useEffect(() => {
    fetch('/roads.geojson')
      .then(r => r.json())
      .then(data => {
        const links = data.features.map((f, i) => ({ ...f, id: i }))
        dispatch({ type: 'SET_LINKS', payload: links })
        try {
          const saved = localStorage.getItem(STORAGE_KEY)
          if (saved) dispatch({ type: 'RESTORE_STATE', payload: JSON.parse(saved) })
        } catch (e) { /* ignore corrupt storage */ }
      })
      .catch(e => console.error('Failed to load roads.geojson:', e))
  }, [])

  // Persist projects/selection to localStorage whenever they change
  useEffect(() => {
    if (!state.links.length) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        projects: state.projects,
        activeProjectId: state.activeProjectId,
        pendingLinkIds: state.pendingLinkIds,
        bufferFt: state.bufferFt,
        autoSuggest: state.autoSuggest,
      }))
    } catch (e) { /* ignore quota errors */ }
  }, [state.projects, state.activeProjectId, state.pendingLinkIds, state.bufferFt, state.autoSuggest])

  return (
    <ProjectContext.Provider value={{ state, dispatch }}>
      <div className="app-layout">
        <div className="left-panel">
          <ProjectManager />
        </div>
        <div className="map-area">
          <MapView />
        </div>
        <div className="right-panel">
          <SummaryPanel />
        </div>
      </div>
    </ProjectContext.Provider>
  )
}
