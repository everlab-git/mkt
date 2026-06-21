import { sanitizeTheme, type SiteTheme } from "../domain/theme";

export const PROJECT_GOALS = [
  "geração de leads",
  "institucional/branding",
  "vendas",
  "outro"
] as const;

export const STARTING_POINTS = ["blank", "institutional"] as const;

export type ProjectGoal = (typeof PROJECT_GOALS)[number];
export type StartingPoint = (typeof STARTING_POINTS)[number];

export interface WizardAiPayload {
  enabled: boolean;
  storytelling: string;
  paletteFromLogo: boolean;
  draftInitialCopy: boolean;
}

export interface WizardPayload {
  name: string;
  goal: ProjectGoal | "";
  logoUrl: string | null;
  theme: SiteTheme;
  startingPoint: StartingPoint | null;
  ai: WizardAiPayload;
}

type WizardPayloadInput = Partial<Omit<WizardPayload, "theme" | "ai" | "startingPoint" | "goal">> & {
  goal?: string | null;
  logoUrl?: string | null;
  theme?: unknown;
  startingPoint?: string | null;
  ai?: Partial<WizardAiPayload> | null;
};

function normalizeString(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeOptionalString(value: unknown): string | null {
  const normalized = normalizeString(value);
  return normalized ? normalized : null;
}

function normalizeGoal(value: unknown): ProjectGoal | "" {
  const normalized = normalizeString(value);

  if (!normalized) {
    return "";
  }

  return PROJECT_GOALS.includes(normalized as ProjectGoal) ? (normalized as ProjectGoal) : "outro";
}

function normalizeStartingPoint(value: unknown): StartingPoint | null {
  return STARTING_POINTS.includes(value as StartingPoint) ? (value as StartingPoint) : null;
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function normalizeWizardPayload(input: WizardPayloadInput): WizardPayload {
  return {
    name: normalizeString(input.name),
    goal: normalizeGoal(input.goal),
    logoUrl: normalizeOptionalString(input.logoUrl),
    theme: sanitizeTheme(input.theme),
    startingPoint: normalizeStartingPoint(input.startingPoint),
    ai: {
      enabled: normalizeBoolean(input.ai?.enabled, false),
      storytelling: normalizeString(input.ai?.storytelling),
      paletteFromLogo: normalizeBoolean(input.ai?.paletteFromLogo, true),
      draftInitialCopy: normalizeBoolean(input.ai?.draftInitialCopy, true)
    }
  };
}
