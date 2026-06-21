export type ViewId = "builder" | "pages" | "settings" | "preview";

export type SectionType =
  | "hero"
  | "cards"
  | "stats"
  | "text"
  | "video"
  | "carousel"
  | "gallery"
  | "cta"
  | "form"
  | "testimonials";

export interface Section {
  id: string;
  type: SectionType;
  transition: "fade" | "slideUp" | "reveal";
}

export interface AppState {
  view: ViewId;
  sections: Section[];
  selSectionId: string | null;
}

