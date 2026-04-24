import { useContext } from 'react'
import { ProjectContext } from '../store/ProjectContext'
import { calcStats, fmtCurrency, fmtMi } from '../utils/stats'

const PCI_BAR_COLORS = {
  'Failed (0-24)':    '#d73027',
  'Poor (25-49)':     '#fc8d59',
  'Fair (50-69)':     '#fee08b',
  'Good (70-84)':     '#91cf60',
  'Excellent (85-100)': '#1a9850',
}

function StatsBlock({ title, color, stats }) {
  if (!stats) return null
  const total = Object.values(stats.pciDist).reduce((s, v) => s + v, 0)

  return (
    <div style={{ borderLeft: `3px solid ${color}`, marginBottom: 12 }}>
      <div style={{ padding: '6px 14px', background: '#0f3460', color, fontWeight: 700, fontSize: 12 }}>
        {title}
      </div>
      {[
        ['Segments',            stats.count],
        ['Total Length',        fmtMi(stats.totalLength_mi)],
        ['Resurface Cost',      fmtCurrency(stats.totalResurf)],
        ['Reconstruction Cost', fmtCurrency(stats.totalRecon)],
        ['Cost / Mile',         fmtCurrency(stats.costPerMile)],
        ['Avg PCI',             stats.avgPCI.toFixed(1)],
      ].map(([label, value]) => (
        <div className="stat-row" key={label}>
          <span className="stat-label">{label}</span>
          <span className="stat-value">{value}</span>
        </div>
      ))}

      <div className="pci-bar-container">
        <div style={{ fontSize: 10, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          PCI Distribution
        </div>
        {Object.entries(stats.pciDist).map(([key, count]) => (
          <div className="pci-bar-row" key={key}>
            <span className="pci-bar-label" style={{ fontSize: 10 }}>{key.split(' ')[0]}</span>
            <div className="pci-bar-bg">
              <div
                className="pci-bar-fill"
                style={{
                  width: total > 0 ? `${(count / total) * 100}%` : '0%',
                  background: PCI_BAR_COLORS[key] || '#888',
                }}
              />
            </div>
            <span className="pci-bar-count">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SummaryPanel() {
  const { state } = useContext(ProjectContext)

  const activeProject = state.projects.find(p => p.id === state.activeProjectId)
  const pendingStats  = calcStats(state.links, state.pendingLinkIds)
  const confirmedProjects = state.projects.filter(p => p.confirmed)

  return (
    <div>
      <div className="panel-header">Summary Statistics</div>

      {activeProject && (
        <>
          <div style={{ padding: '8px 14px', background: '#0f3460', fontSize: 11, color: '#aaa' }}>
            Live — {activeProject.name}
          </div>
          {pendingStats
            ? <StatsBlock title={activeProject.name} color={activeProject.color} stats={pendingStats} />
            : <div style={{ padding: 14, color: '#555', fontSize: 11 }}>Select links on the map…</div>
          }
        </>
      )}

      {confirmedProjects.length > 0 && (
        <>
          <div style={{ padding: '6px 14px', background: '#0a2038', fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: 1 }}>
            Confirmed Projects
          </div>
          {confirmedProjects.map(p => {
            const stats = calcStats(state.links, p.linkIds)
            return <StatsBlock key={p.id} title={p.name} color={p.color} stats={stats} />
          })}
        </>
      )}

      {!activeProject && !confirmedProjects.length && (
        <div style={{ padding: 20, color: '#555', fontSize: 12 }}>
          Create a project and select links to see statistics.
        </div>
      )}
    </div>
  )
}
