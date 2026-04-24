import { createContext } from 'react'

export const ProjectContext = createContext(null)

export const PROJECT_COLORS = [
  '#e94560', '#2ecc71', '#3498db', '#f39c12',
  '#9b59b6', '#1abc9c', '#e67e22', '#e91e63',
]

export const initialState = {
  links: [],
  projects: [],
  activeProjectId: null,
  pendingLinkIds: [],
  suggestedLinkIds: [],
  autoSuggest: true,
  zoomTargetId: null,
  bufferFt: 500,
}

export function reducer(state, action) {
  switch (action.type) {

    case 'SET_LINKS':
      return { ...state, links: action.payload }

    case 'CREATE_PROJECT': {
      const id = Date.now()
      const color = PROJECT_COLORS[state.projects.length % PROJECT_COLORS.length]
      return {
        ...state,
        projects: [
          ...state.projects,
          { id, name: action.payload, color, confirmed: false, linkIds: [], buffer: null },
        ],
        activeProjectId: id,
        pendingLinkIds: [],
        suggestedLinkIds: [],
      }
    }

    case 'SET_ACTIVE_PROJECT':
      return { ...state, activeProjectId: action.payload, pendingLinkIds: [], suggestedLinkIds: [] }

    case 'TOGGLE_LINK': {
      const lid = action.payload
      const pending = state.pendingLinkIds.includes(lid)
        ? state.pendingLinkIds.filter(id => id !== lid)
        : [...state.pendingLinkIds, lid]
      return { ...state, pendingLinkIds: pending }
    }

    case 'UNDO_LAST':
      return { ...state, pendingLinkIds: state.pendingLinkIds.slice(0, -1) }

    case 'CONFIRM_PROJECT': {
      const linkIds = action.payload.linkIds ?? [...state.pendingLinkIds]
      const updated = state.projects.map(p =>
        p.id === state.activeProjectId
          ? { ...p, confirmed: true, linkIds, buffer: action.payload.buffer }
          : p
      )
      return { ...state, projects: updated, activeProjectId: null, pendingLinkIds: [], suggestedLinkIds: [] }
    }

    case 'REMOVE_LINK_FROM_PROJECT': {
      const { projectId, linkId } = action.payload
      const updated = state.projects.map(p =>
        p.id === projectId
          ? { ...p, linkIds: p.linkIds.filter(id => id !== linkId) }
          : p
      )
      return { ...state, projects: updated }
    }

    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.payload),
        activeProjectId: state.activeProjectId === action.payload ? null : state.activeProjectId,
        pendingLinkIds: state.activeProjectId === action.payload ? [] : state.pendingLinkIds,
      }

    case 'RENAME_PROJECT': {
      const { id, name } = action.payload
      return { ...state, projects: state.projects.map(p => p.id === id ? { ...p, name } : p) }
    }

    case 'EDIT_PROJECT': {
      const project = state.projects.find(p => p.id === action.payload)
      if (!project) return state
      return { ...state, activeProjectId: project.id, pendingLinkIds: [...project.linkIds], suggestedLinkIds: [], autoSuggest: false }
    }

    case 'SET_BUFFER_FT':
      return { ...state, bufferFt: action.payload }

    case 'SET_SUGGESTED_LINKS':
      return { ...state, suggestedLinkIds: action.payload }

    case 'SET_AUTO_SUGGEST':
      return { ...state, autoSuggest: action.payload, suggestedLinkIds: [] }

    case 'RESET_ALL':
      return { ...initialState, links: state.links }

    case 'RESTORE_STATE':
      return {
        ...state,
        projects: action.payload.projects ?? state.projects,
        activeProjectId: action.payload.activeProjectId ?? state.activeProjectId,
        pendingLinkIds: action.payload.pendingLinkIds ?? state.pendingLinkIds,
        bufferFt: action.payload.bufferFt ?? state.bufferFt,
        autoSuggest: action.payload.autoSuggest ?? state.autoSuggest,
      }

    case 'CLEAR_SELECTION':
      return { ...state, pendingLinkIds: [], suggestedLinkIds: [] }

    case 'SET_ZOOM_TARGET':
      return { ...state, zoomTargetId: action.payload }

    case 'IMPORT_PROJECTS':
      return { ...state, projects: action.payload, activeProjectId: null, pendingLinkIds: [], suggestedLinkIds: [], zoomTargetId: null }

    default:
      return state
  }
}
