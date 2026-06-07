import type { AppState, Section } from "./types";
import type { Action } from "./actions";
import { uid } from "../utils/uid";

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_VIEW":
      return { ...state, view: action.view };

    case "ADD_SECTION": {
      const next: Section = { id: uid(), type: action.stype, transition: "fade" };
      const at = action.atIdx ?? state.sections.length;
      const sections = [...state.sections.slice(0, at), next, ...state.sections.slice(at)];
      return { ...state, sections, selSectionId: next.id };
    }

    case "REMOVE_SECTION": {
      const sections = state.sections.filter((s) => s.id !== action.id);
      const selSectionId =
        state.selSectionId === action.id ? (sections[0]?.id ?? null) : state.selSectionId;
      return { ...state, sections, selSectionId };
    }

    case "SELECT_SECTION":
      return { ...state, selSectionId: action.id };

    default:
      return state;
  }
}

