import { useContext, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import * as turf from '@turf/turf'
import 'leaflet/dist/leaflet.css'
import { ProjectContext } from '../store/ProjectContext'

const PCI_COLORS = { 'Failed': '#d73027', 'Poor': '#fc8d59', 'Fair': '#fee08b', 'Good': '#91cf60', 'Excellent': '#1a9850' }

function getPciColor(pci) {
  if (pci == null) return '#aaa'
  if (pci < 25) return PCI_COLORS.Failed
  if (pci < 50) return PCI_COLORS.Poor
  if (pci < 70) return PCI_COLORS.Fair
  if (pci < 85) return PCI_COLORS.Good
  return PCI_COLORS.Excellent
}

function ZoomController() {
  const { state, dispatch } = useContext(ProjectContext)
  const map = useMap()
  useEffect(() => {
    const id = state.zoomTargetId
    if (!id) return
    const project = state.projects.find(p => p.id === id)
    if (!project) return
    const ids = project.id === state.activeProjectId ? state.pendingLinkIds : project.linkIds
    if (!ids.length) return
    const features = state.links.filter(f => ids.includes(f.id))
    if (!features.length) return
    try {
      const fc = { type: 'FeatureCollection', features }
      const [minX, minY, maxX, maxY] = turf.bbox(fc)
      map.flyToBounds([[minY, minX], [maxY, maxX]], { padding: [60, 60] })
    } catch (e) {}
    dispatch({ type: 'SET_ZOOM_TARGET', payload: null })
  }, [state.zoomTargetId]) // eslint-disable-line
  return null
}

function BoundsController({ links }) {
  const map = useMap()
  useEffect(() => {
    if (!links.length) return
    try {
      const fc = { type: 'FeatureCollection', features: links }
      const [minX, minY, maxX, maxY] = turf.bbox(fc)
      map.fitBounds([[minY, minX], [maxY, maxX]], { padding: [20, 20] })
    } catch (e) { /* ignore */ }
  }, [links.length]) // eslint-disable-line
  return null
}

export default function MapView() {
  const { state, dispatch } = useContext(ProjectContext)

  // Build lookup sets for fast style decisions
  const pendingSet = new Set(state.pendingLinkIds)
  const confirmedMap = new Map()   // linkId -> project
  state.projects.filter(p => p.confirmed).forEach(p => {
    p.linkIds.forEach(id => confirmedMap.set(id, p))
  })

  const getStyle = (feature) => {
    const id = feature.id
    if (pendingSet.has(id))    return { color: '#00E5FF', weight: 8, opacity: 1 }
    if (confirmedMap.has(id))  return { color: confirmedMap.get(id).color, weight: 5, opacity: 1 }
    return { color: getPciColor(feature.properties?.PCI), weight: 4, opacity: 0.85 }
  }

  const onEachFeature = (feature, layer) => {
    const p = feature.properties || {}
    layer.bindTooltip(
      `<b>${p.STREET || 'N/A'}</b><br/>
       ${p.LOC_FROM || ''} → ${p.LOC_TO || ''}<br/>
       PCI: ${p.PCI?.toFixed(1) ?? 'N/A'} (${p.PCI_RANK || ''})<br/>
       Length: ${p.LENGTH?.toFixed(0) ?? 'N/A'} ft<br/>
       Resurface: $${(p.Resurface || 0).toLocaleString()}<br/>
       Recon: $${(p.Reconstruc || 0).toLocaleString()}`,
      { sticky: true }
    )
    layer.on('click', () => {
      if (!state.activeProjectId) return
      dispatch({ type: 'TOGGLE_LINK', payload: feature.id })
    })
    layer.on('mouseover', () => {
      const s = getStyle(feature)
      layer.setStyle({ ...s, weight: s.weight + 3, opacity: 1 })
      const el = layer.getElement()
      if (el) el.style.filter = 'drop-shadow(0 0 4px #001f4d) drop-shadow(0 0 2px #001f4d)'
    })
    layer.on('mouseout', () => {
      layer.setStyle(getStyle(feature))
      const el = layer.getElement()
      if (el) el.style.filter = ''
    })
  }

  // Key forces re-render on selection changes so styles update
  // Must include activeProjectId — changing it doesn't alter pendingLinkIds (already []) so without it the GeoJSON layer won't remount and onEachFeature will have a stale closure with activeProjectId=null
  const mapKey = `${state.activeProjectId}-${JSON.stringify(state.pendingLinkIds)}-${state.projects.map(p => p.linkIds.join()).join('|')}`

  return (
    <MapContainer
      center={[34.15, -118.1]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <BoundsController links={state.links} />
      {state.links.length > 0 && (
        <GeoJSON
          key={mapKey}
          data={{ type: 'FeatureCollection', features: state.links }}
          style={getStyle}
          onEachFeature={onEachFeature}
        />
      )}
      {state.projects.filter(p => p.buffer).map(p => (
        <GeoJSON
          key={`buf-${p.id}`}
          data={p.buffer}
          style={{ color: p.color, fillColor: p.color, fillOpacity: 0.1, weight: 2, dashArray: '6 4' }}
        />
      ))}
      <ZoomController />
    </MapContainer>
  )
}
