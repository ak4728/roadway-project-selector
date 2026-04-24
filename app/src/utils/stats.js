const FT_PER_MILE = 5280

export function calcStats(links, linkIds) {
  if (!linkIds.length) return null
  const selected = links.filter(f => linkIds.includes(f.id))
  if (!selected.length) return null

  const p = selected.map(f => f.properties)

  const count          = selected.length
  const totalLength_ft = p.reduce((s, r) => s + (r.LENGTH || 0), 0)
  const totalLength_mi = totalLength_ft / FT_PER_MILE
  const totalResurf    = p.reduce((s, r) => s + (r.Resurface  || 0), 0)
  const totalRecon     = p.reduce((s, r) => s + (r.Reconstruc || 0), 0)
  const pciValues      = p.filter(r => r.PCI != null).map(r => r.PCI)
  const avgPCI         = pciValues.length
    ? pciValues.reduce((s, v) => s + v, 0) / pciValues.length
    : 0
  const costPerMile    = totalLength_mi > 0 ? totalResurf / totalLength_mi : 0

  const pciDist = { 'Failed (0-24)': 0, 'Poor (25-49)': 0, 'Fair (50-69)': 0, 'Good (70-84)': 0, 'Excellent (85-100)': 0 }
  pciValues.forEach(v => {
    if      (v < 25) pciDist['Failed (0-24)']++
    else if (v < 50) pciDist['Poor (25-49)']++
    else if (v < 70) pciDist['Fair (50-69)']++
    else if (v < 85) pciDist['Good (70-84)']++
    else             pciDist['Excellent (85-100)']++
  })

  return { count, totalLength_ft, totalLength_mi, totalResurf, totalRecon, avgPCI, costPerMile, pciDist }
}

export function fmtCurrency(n) {
  return n == null ? 'N/A' : '$' + Math.round(n).toLocaleString()
}

export function fmtMi(n) {
  return n == null ? 'N/A' : n.toFixed(2) + ' mi'
}

export function exportGeoJSON(links, linkIds, projectName) {
  const features = links.filter(f => linkIds.includes(f.id))
  const fc = { type: 'FeatureCollection', features }
  const blob = new Blob([JSON.stringify(fc, null, 2)], { type: 'application/json' })
  triggerDownload(blob, `${projectName}_links.geojson`)
}

export function exportCSV(stats, projectName) {
  const rows = [
    ['Metric', 'Value'],
    ['Project', projectName],
    ['Segment Count', stats.count],
    ['Total Length (ft)', stats.totalLength_ft.toFixed(0)],
    ['Total Length (mi)', stats.totalLength_mi.toFixed(3)],
    ['Total Resurface Cost', stats.totalResurf.toFixed(2)],
    ['Total Reconstruction Cost', stats.totalRecon.toFixed(2)],
    ['Cost Per Mile (Resurface)', stats.costPerMile.toFixed(2)],
    ['Average PCI', stats.avgPCI.toFixed(1)],
    ...Object.entries(stats.pciDist).map(([k, v]) => [`PCI ${k}`, v]),
  ]
  const csv = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  triggerDownload(blob, `${projectName}_summary.csv`)
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
