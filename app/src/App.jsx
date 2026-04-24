import React, { useEffect, useReducer } from 'react'
import MapView from './components/MapView'
import ProjectManager from './components/ProjectManager'
import SummaryPanel from './components/SummaryPanel'
import { ProjectContext, initialState, reducer } from './store/ProjectContext'

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    fetch('/roads.geojson')
      .then(r => r.json())
      .then(data => {
        const links = data.features.map((f, i) => ({ ...f, id: i }))
        dispatch({ type: 'SET_LINKS', payload: links })
      })
      .catch(e => console.error('Failed to load roads.geojson:', e))
  }, [])

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
