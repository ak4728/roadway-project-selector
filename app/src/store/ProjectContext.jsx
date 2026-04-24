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
      }
    }

    case 'SET_ACTIVE_PROJECT':
      return { ...state, activeProjectId: action.payload, pendingLinkIds: [] }

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
      const updated = state.projects.map(p =>
        p.id === state.activeProjectId
          ? { ...p, confirmed: true, linkIds: [...state.pendingLinkIds], buffer: action.payload.buffer }
          : p
      )
      return { ...state, projects: updated, activeProjectId: null, pendingLinkIds: [] }
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

    default:
      return state
  }
}
