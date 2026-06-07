import type { SectionType, ViewId } from "./types";

export type Action =
  | { type: "SET_VIEW"; view: ViewId }
  | { type: "ADD_SECTION"; stype: SectionType; atIdx?: number }
  | { type: "REMOVE_SECTION"; id: string }
  | { type: "SELECT_SECTION"; id: string | null };

