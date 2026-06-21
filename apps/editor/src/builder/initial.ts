import type { BuilderState } from "./types";

const siteLanguages = {
  default: "pt-BR",
  enabled: ["pt-BR", "en"]
} as const;

const homeSections = [
  {
    id: "section-hero",
    type: "hero",
    animationPreset: null,
    props: {
      title: "Builder persuasion"
    },
    i18n: {
      "pt-BR": {
        ai_generated: false,
        title: "Builder persuasion"
      },
      en: {
        ai_generated: false,
        title: "Builder persuasion"
      }
    },
    blocks: [
      {
        id: "block-hero-heading",
        type: "text",
        animationPreset: null,
        persuasion: null,
        props: {
          as: "h1",
          content: "Crie narrativas com persuasão modular."
        },
        i18n: {
          "pt-BR": {
            ai_generated: false,
            content: "Crie narrativas com persuasão modular."
          },
          en: {
            ai_generated: false,
            content: "Build modular persuasion stories."
          }
        }
      },
      {
        id: "block-hero-cta",
        type: "button",
        animationPreset: null,
        persuasion: null,
        props: {
          label: "Falar com o time",
          href: "/contato"
        },
        i18n: {
          "pt-BR": {
            ai_generated: false,
            label: "Falar com o time"
          },
          en: {
            ai_generated: false,
            label: "Talk to the team"
          }
        }
      }
    ]
  },
  {
    id: "section-cases",
    type: "cases",
    animationPreset: null,
    props: {
      title: "Cases"
    },
    i18n: {
      "pt-BR": {
        ai_generated: false,
        title: "Cases"
      },
      en: {
        ai_generated: false,
        title: "Case studies"
      }
    },
    blocks: []
  }
];

export const initialBuilderState: BuilderState = {
  view: "pages",
  siteLanguages: {
    default: siteLanguages.default,
    enabled: [...siteLanguages.enabled]
  },
  activeLocale: siteLanguages.default,
  pages: [
    {
      id: "page-home",
      name: "Home",
      slug: "/",
      localizedSlug: {
        "pt-BR": "/",
        en: "/en"
      },
      status: "draft",
      followVisualModel: false,
      seo: {
        title: "",
        description: "",
        ogImage: "",
        canonical: "/"
      },
      localizedSeo: {
        "pt-BR": {
          title: "",
          description: "",
          ogImage: "",
          canonical: "/"
        },
        en: {
          title: "Home",
          description: "Home page ready for launch",
          ogImage: "",
          canonical: "/en"
        }
      },
      sections: structuredClone(homeSections)
    },
    {
      id: "page-cases",
      name: "Cases",
      slug: "/cases",
      localizedSlug: {
        "pt-BR": "/cases",
        en: "/en/cases"
      },
      status: "published",
      followVisualModel: false,
      seo: {
        title: "Cases",
        description: "Projetos publicados e resultados do estúdio.",
        ogImage: "",
        canonical: "/cases"
      },
      localizedSeo: {
        "pt-BR": {
          title: "Cases",
          description: "Projetos publicados e resultados do estúdio.",
          ogImage: "",
          canonical: "/cases"
        },
        en: {
          title: "Cases",
          description: "Published work and studio outcomes.",
          ogImage: "",
          canonical: "/en/cases"
        }
      },
      sections: [
        {
          id: "section-cases-page-hero",
          type: "cases",
          animationPreset: null,
          props: {
            title: "Cases"
          },
          i18n: {
            "pt-BR": {
              ai_generated: false,
              title: "Cases"
            },
            en: {
              ai_generated: false,
              title: "Case studies"
            }
          },
          blocks: []
        }
      ]
    }
  ],
  activePageId: "page-home",
  sections: structuredClone(homeSections),
  selectedSectionId: "section-hero",
  selectedBlockId: "block-hero-heading",
  publishValidationMessage: null
};
