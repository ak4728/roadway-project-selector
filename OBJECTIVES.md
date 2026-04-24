# Objectives

## Goal
Build a web-based interactive map tool for grouping roadway segments into projects and generating live summary statistics.

## Core Workflow
1. Load roads.geojson (873 line features, WGS84) into a React + Leaflet map.
2. User creates a named project (e.g. "Project 1").
3. User clicks individual segments on the map to assign them to the active project.
4. Live statistics update in the right panel as segments are selected.
5. User confirms the project → buffer polygon is generated around selected links.
6. Repeat for additional projects. Each project gets a unique color.
7. Export individual project links as GeoJSON or summary stats as CSV.

## Key Constraints
- Runs entirely in the browser (no backend needed).
- Source data: `roads.geojson` placed in `app/public/`.
- Built with React 18 + Vite 4 + react-leaflet 4 + @turf/turf 6.
- Requires Node >= 18 (tested on Node 20 LTS).

## Future Extensions
- Weighted PCI scoring and prioritization
- Normalized cost-effectiveness metrics
- Dashboard-style charts (add recharts or chart.js)
- Multi-year planning groupings
- Backend persistence (save/load projects as JSON)
