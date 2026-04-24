# Roadway Project Selector

An interactive browser-based tool for grouping roadway segments into capital improvement projects, with live statistics and export capabilities.

## Live Demo
Deployed at [Render](https://render.com) — connect the repo as a Static Site to deploy automatically.

## Features

- **Interactive Leaflet map** with CartoDB Positron basemap and PCI heatmap coloring
- **Project management** — create, rename, edit, confirm, and delete projects
- **Click-to-select** road segments; selected segments highlight in cyan
- **Auto-suggest** — automatically highlights nearby cross-streets in purple based on a configurable buffer distance (feet); toggle on/off per session
- **Live statistics** in the right panel (per active project and all confirmed projects):
  - Segment count, total length, resurface/reconstruction cost, cost per mile
  - Average PCI + PCI distribution bar chart
  - Corridor info: pavement type, AC thickness, last rehab/seal dates, functional class distribution
- **Buffer polygon** drawn around confirmed project links (configurable, default 500 ft)
- **Undo**, **Clear selection**, **Zoom to project** controls
- **Export** per project: GeoJSON (links) + CSV (summary stats)
- **Export all** confirmed projects as a single JSON file; **import** it back on any machine
- **Reset all** button with confirmation
- **localStorage persistence** — projects and selections survive page refresh

## Tech Stack

| Package | Version |
|---|---|
| React | 18 |
| Vite | 4 |
| react-leaflet | 4 |
| @turf/turf | 6 |
| Node | ≥ 18 |

## Getting Started

```bash
# 1. Install dependencies
cd app
npm install

# 2. Run dev server
npm run dev
# Open http://localhost:5173
```

## Deployment (Render)

The repo includes a `render.yaml` config. On [render.com](https://render.com):

1. **New → Static Site** → connect this repo
2. Render auto-detects the config:
   - Root directory: `app`
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`
3. Click **Create Static Site**

## Data

Source shapefile: `export.shp` (EPSG:2229, 873 features) — converted to `roads.geojson` (EPSG:4326) via geopandas and placed in `app/public/`.

Key fields used: `STREET`, `LOC_FROM`, `LOC_TO`, `PCI`, `PCI_RANK`, `LENGTH`, `Resurface`, `Reconstruc`, `PAVE_WIDTH`, `FUNCL_CLAS`, `LANES`, `AREA_SF`, `AC_THICK`, `PAVE_TYPE`, `LAST_REH_1`, `LAST_SEAL_1`
