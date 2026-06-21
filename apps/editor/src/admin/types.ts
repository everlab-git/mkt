export type ProjectGoal =
  | "geração de leads"
  | "institucional/branding"
  | "vendas"
  | "outro";

export type ProjectView = "wizard" | "pages" | "settings" | "preview" | "builder";

export type ProjectStartingPoint = "blank" | "institutional";

export interface ProjectAiOptions {
  enabled: boolean;
  storytelling: string;
  paletteFromLogo: boolean;
  draftInitialCopy: boolean;
}

export interface ProjectSummary {
  id: string;
  name: string;
  slug: string;
  goal: ProjectGoal | null;
  logoUrl: string | null;
}
