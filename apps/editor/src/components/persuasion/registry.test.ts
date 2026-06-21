import { describe, expect, it } from "vitest";
import { hasPersuasionPattern, persuasionRegistry } from "./registry";
import { usePersuasion } from "./usePersuasion";

describe("persuasionRegistry", () => {
  it("expõe os quatro padrões desta rodada", () => {
    expect(Object.keys(persuasionRegistry).sort()).toEqual([
      "anchoring",
      "authority",
      "frictionReduction",
      "socialProof"
    ]);
  });

  it("não expõe urgency nesta rodada", () => {
    expect(hasPersuasionPattern("urgency")).toBe(false);
  });

  it("resolve socialProof com campos normalizados", () => {
    expect(
      usePersuasion({
        pattern: "socialProof",
        options: {
          value: "128",
          label: "equipes",
          suffix: "+"
        }
      })
    ).toEqual({
      animatedValue: 128,
      badges: ["128+ equipes"],
      className: "persuasion-social-proof"
    });
  });

  it("resolve authority com badges e destaque", () => {
    expect(
      usePersuasion({
        pattern: "authority",
        options: {
          badges: ["ISO 27001", "Gartner"]
        }
      })
    ).toEqual({
      badges: ["ISO 27001", "Gartner"],
      highlighted: true,
      className: "persuasion-authority"
    });
  });

  it("resolve anchoring com destaque da opção recomendada", () => {
    expect(
      usePersuasion({
        pattern: "anchoring",
        options: {
          recommended: true
        }
      })
    ).toEqual({
      highlighted: true,
      className: "persuasion-anchoring"
    });
  });

  it("resolve frictionReduction com progressividade", () => {
    expect(
      usePersuasion({
        pattern: "frictionReduction",
        options: {
          steps: 2
        }
      })
    ).toEqual({
      progressive: true,
      className: "persuasion-friction-reduction"
    });
  });

  it("retorna null para padrões ausentes", () => {
    expect(
      usePersuasion({
        pattern: "urgency",
        options: {
          countdown: "01:00"
        }
      })
    ).toBeNull();
  });
});
