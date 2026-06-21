import type { PageContent } from "../domain/content";
import { normalizeSeoPayload, type SeoPayload } from "./seo";

export type PageCreationStrategy = "template" | "duplicate" | "blank";
export type PageTemplateKey = "institutional" | "services" | "cases" | "contact";

export interface PageCreationSource {
  content: PageContent;
  seo: Partial<SeoPayload>;
}

export interface BuildPagePayloadInput {
  strategy: PageCreationStrategy;
  name: string;
  slug?: string;
  templateKey?: PageTemplateKey;
  sourcePage?: PageCreationSource;
}

export interface PagePayload {
  content: PageContent;
  seo: SeoPayload;
}

const TEMPLATE_STARTERS: Record<PageTemplateKey, PageContent> = {
  institutional: {
    sections: [
      {
        id: "institutional-hero",
        type: "hero",
        animationPreset: null,
        props: {
          title: "Institucional",
          description: "Apresente a proposta do projeto com uma mensagem clara e objetiva."
        },
        blocks: []
      }
    ]
  },
  services: {
    sections: [
      {
        id: "services-hero",
        type: "hero",
        animationPreset: null,
        props: {
          title: "Serviços",
          description: "Liste os principais serviços ou entregas com descrições curtas."
        },
        blocks: []
      }
    ]
  },
  cases: {
    sections: [
      {
        id: "cases-hero",
        type: "hero",
        animationPreset: null,
        props: {
          title: "Cases",
          description: "Mostre resultados, depoimentos ou exemplos de trabalhos anteriores."
        },
        blocks: []
      }
    ]
  },
  contact: {
    sections: [
      {
        id: "contact-hero",
        type: "hero",
        animationPreset: null,
        props: {
          title: "Contato",
          description: "Adicione canais de contato, horários e um convite para conversar."
        },
        blocks: []
      }
    ]
  }
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function buildCanonicalFallback(slug?: string): string {
  const normalizedSlug = String(slug ?? "").trim().replace(/^\/+/, "");
  return normalizedSlug ? `/${normalizedSlug}` : "/";
}

export function buildPagePayload(input: BuildPagePayloadInput): PagePayload {
  const fallbackCanonical = buildCanonicalFallback(input.slug);

  if (input.strategy === "blank") {
    return {
      content: { sections: [] },
      seo: normalizeSeoPayload({}, fallbackCanonical)
    };
  }

  if (input.strategy === "duplicate" && input.sourcePage) {
    return {
      content: clone(input.sourcePage.content),
      seo: normalizeSeoPayload(input.sourcePage.seo, fallbackCanonical)
    };
  }

  const templateKey = input.templateKey ?? "institutional";

  return {
    content: clone(TEMPLATE_STARTERS[templateKey]),
    seo: normalizeSeoPayload({}, fallbackCanonical)
  };
}
