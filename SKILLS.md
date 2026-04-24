# Skills & Patterns for Copilot

## State Management
- All state lives in `app/src/store/ProjectContext.jsx` using `useReducer` + React Context.
- Dispatch actions: SET_LINKS, CREATE_PROJECT, TOGGLE_LINK, UNDO_LAST, CONFIRM_PROJECT, REMOVE_LINK_FROM_PROJECT, DELETE_PROJECT.
- Buffer is generated in the component (turf.buffer) and passed into CONFIRM_PROJECT as payload.

## Map Re-rendering Pattern
- react-leaflet `<GeoJSON>` uses a `key` prop that changes when `pendingLinkIds` or confirmed `linkIds` change.
- This forces a full remount of the GeoJSON layer to update styles after selection.
- Performance is acceptable for ~900 features. For larger datasets, use individual layer `setStyle()` calls.

## Feature IDs
- GeoJSON features are assigned sequential numeric IDs when loaded: `features.map((f, i) => ({ ...f, id: i }))`.
- All selection state references these IDs.

## Statistics
- All stats logic is in `app/src/utils/stats.js` — `calcStats(links, linkIds)`.
- `LENGTH` field is in feet; convert to miles with `/5280`.
- PCI ranges: Failed 0-24, Poor 25-49, Fair 50-69, Good 70-84, Excellent 85-100.

## Styling Conventions
- Dark theme: background #1a1a2e, panels #16213e, accent #e94560.
- Project colors cycle through PROJECT_COLORS array in ProjectContext.jsx.
- Default link color = PCI heatmap (red→green), selected = #FFD700, confirmed = project color.

## Extending the App
- Add new stats fields in `calcStats()` in `stats.js`.
- Add new action types in `reducer()` in `ProjectContext.jsx`.
- Add new UI in `SummaryPanel.jsx` for additional metrics.
- For charts, install `recharts` and drop in a `<BarChart>` in SummaryPanel.
