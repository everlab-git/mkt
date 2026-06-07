import type { AppState } from "./types";
import { uid } from "../utils/uid";

export const initialState: AppState = {
  view: "builder",
  sections: [{ id: uid(), type: "hero", transition: "fade" }],
  selSectionId: null
};

