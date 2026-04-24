# Reminders

## Setup Steps (on a new machine)
```bash
# 1. Clone the repo
git clone <repo-url>
cd roadway-project-selector

# 2. Copy roads.geojson to the public folder
cp roads.geojson app/public/roads.geojson        # macOS/Linux
copy roads.geojson app\public\roads.geojson      # Windows CMD

# 3. Install dependencies
cd app
npm install

# 4. Run dev server
npm run dev
# Open http://localhost:5173
```

## Regenerating roads.geojson from shapefile
```bash
cd roadway-project-selector
python -c "
import geopandas as gpd
gdf = gpd.read_file('export.shp').to_crs('EPSG:4326')
gdf.to_file('roads.geojson', driver='GeoJSON')
print('Done:', len(gdf), 'features')
"
```

## Node Version
- Requires Node >= 18. Vite 4 supports Node 14.18+.
- If `npm create vite` fails, scaffold manually (files are already in `app/`).

## File Layout
```
roadway-project-selector/
├── export.shp + sidecar files   ← original shapefile
├── roads.geojson                ← converted, copy to app/public/
├── OBJECTIVES.md
├── REQUIREMENTS.md
├── REMINDERS.md
├── SKILLS.md
└── app/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── App.css
        ├── store/ProjectContext.jsx    ← all state (useReducer + Context)
        ├── utils/stats.js              ← calcStats, export helpers
        └── components/
            ├── MapView.jsx             ← Leaflet map
            ├── ProjectManager.jsx      ← left panel
            └── SummaryPanel.jsx        ← right panel
```
