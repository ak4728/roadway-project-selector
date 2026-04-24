# Requirements

## Data
- Source: `export.shp` (EPSG:2229, 873 features)
- Converted to: `roads.geojson` (EPSG:4326) via geopandas
- Key attribute fields used by the app:
  - `STREET` — street name
  - `LOC_FROM`, `LOC_TO` — segment limits
  - `PCI` — pavement condition index (float)
  - `PCI_RANK` — text label (Poor, Fair, Good, etc.)
  - `LENGTH` — segment length in feet
  - `Resurface` — resurfacing cost ($)
  - `Reconstruc` — reconstruction cost ($)
  - `PAVE_WIDTH` — pavement width (ft)
  - `FUNCL_CLAS` — functional classification
  - `LANES` — number of lanes
  - `AREA_SF` — area in square feet (derived)

## Calculated Statistics (per project)
- Segment count
- Total length (ft and miles)
- Total resurfacing cost
- Total reconstruction cost
- Cost per mile (resurfacing)
- Average PCI
- PCI distribution by range: Failed 0-24, Poor 25-49, Fair 50-69, Good 70-84, Excellent 85-100

## UI Requirements
- Left panel: project creation, active project controls, confirmed project list
- Center: Leaflet map with OpenStreetMap tiles
- Right panel: live stats for active project + confirmed project summaries
- Link color coding: default=PCI heatmap, selected=yellow, confirmed=project color
- Buffer polygon around confirmed projects (configurable meters, default 50m)
- Undo last link selection
- Remove individual links from pending selection
- Export: GeoJSON (selected links) and CSV (summary stats)

## Tech Stack
- React 18 (useReducer + Context for state)
- Vite 4 (bundler)
- react-leaflet 4 + Leaflet 1.9
- @turf/turf 6 (buffering, bounding box)
- Node >= 18 required
