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
    if (pendingSet.has(id))    return { color: '#FFD700', weight: 5, opacity: 1 }
    if (confirmedMap.has(id))  return { color: confirmedMap.get(id).color, weight: 4, opacity: 0.9 }
    return { color: getPciColor(feature.properties?.PCI), weight: 2, opacity: 0.6 }
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
    layer.on('mouseover', () => layer.setStyle({ weight: 5 }))
    layer.on('mouseout',  () => layer.setStyle(getStyle(feature)))
  }

  // Key forces re-render on selection changes so styles update
  const mapKey = `${JSON.stringify(state.pendingLinkIds)}-${state.projects.map(p => p.linkIds.join()).join('|')}`

  return (
    <MapContainer
      center={[34.15, -118.1]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
          style={{ color: p.color, fillColor: p.color, fillOpacity: 0.08, weight: 2, dashArray: '6 4' }}
        />
      ))}
    </MapContainer>
  )
}
