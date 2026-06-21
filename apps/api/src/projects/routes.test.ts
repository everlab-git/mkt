import { beforeEach, describe, expect, it, vi } from "vitest";

const queryMock = vi.fn();

vi.mock("../db/client", () => ({
  getDbPool: vi.fn(() => ({
    query: queryMock
  }))
}));

vi.mock("../auth/middleware", () => ({
  authSessionMiddleware: async (c: {
    req: { header: (name: string) => string | undefined };
    set: (name: "authUserId", value: string | null) => void;
  }, next: () => Promise<void>) => {
    const cookie = c.req.header("cookie") ?? "";
    c.set("authUserId", cookie.includes("freya_session=token-valido") ? "user-123" : null);
    await next();
  }
}));

describe("project HTTP contract", () => {
  beforeEach(() => {
    vi.resetModules();
    queryMock.mockReset();
  });

  it("lista projetos do usuário autenticado em GET /api/projects", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: "site-1",
          name: "Projeto teste",
          slug: "projeto-teste",
          logo_url: null,
          goal: "institucional/branding"
        }
      ]
    });

    const { app } = await import("../index");
    const response = await app.request("/api/projects", {
      headers: {
        cookie: "freya_session=token-valido"
      }
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      projects: [
        {
          id: "site-1",
          name: "Projeto teste",
          slug: "projeto-teste",
          logo_url: null,
          goal: "institucional/branding"
        }
      ]
    });
    expect(queryMock).toHaveBeenCalledTimes(1);
    expect(queryMock.mock.calls[0]?.[0]).toContain("from sites s join project_members pm on pm.site_id = s.id");
    expect(queryMock.mock.calls[0]?.[1]).toEqual(["user-123"]);
  });

  it("cria projeto, vincula owner e gera páginas institucionais draft", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [{ id: "site-1", name: "Projeto teste", slug: "projeto-teste" }]
      })
      .mockResolvedValueOnce({ rowCount: 1, rows: [] })
      .mockResolvedValueOnce({ rowCount: 4, rows: [] });

    const { app } = await import("../index");
    const response = await app.request("/api/projects", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: "freya_session=token-valido"
      },
      body: JSON.stringify({
        name: "Projeto teste",
        goal: "institucional/branding",
        startingPoint: "institutional",
        ai: {
          enabled: false,
          storytelling: "",
          paletteFromLogo: true,
          draftInitialCopy: true
        }
      })
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      project: {
        id: "site-1",
        name: "Projeto teste",
        slug: "projeto-teste"
      }
    });
    expect(queryMock).toHaveBeenCalledTimes(3);
    expect(queryMock.mock.calls[0]?.[0]).toContain("insert into sites");
    expect(queryMock.mock.calls[0]?.[1]?.[0]).toBe("user-123");
    expect(queryMock.mock.calls[0]?.[1]?.[1]).toBe("Projeto teste");
    expect(queryMock.mock.calls[0]?.[1]?.[2]).toBe("projeto-teste");
    expect(queryMock.mock.calls[1]?.[0]).toContain("insert into project_members");
    expect(queryMock.mock.calls[1]?.[1]).toEqual(["site-1", "user-123"]);
    expect(queryMock.mock.calls[2]?.[0]).toContain("insert into pages");
    expect(queryMock.mock.calls[2]?.[0]).toContain("'Institucional'");
    expect(queryMock.mock.calls[2]?.[0]).toContain("'Serviços'");
    expect(queryMock.mock.calls[2]?.[0]).toContain("'Cases'");
    expect(queryMock.mock.calls[2]?.[0]).toContain("'Contato'");
    expect(queryMock.mock.calls[2]?.[1]?.[0]).toBe("site-1");
  });

  it("lista membros do projeto em GET /api/projects/:siteId/members", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          user_id: "user-123",
          email: "owner@example.com",
          name: "Owner",
          role: "owner",
          accepted_at: "2026-06-21T12:00:00.000Z"
        },
        {
          user_id: "user-456",
          email: "member@example.com",
          name: "Member",
          role: "member",
          accepted_at: null
        }
      ]
    });

    const { app } = await import("../index");
    const response = await app.request("/api/projects/site-1/members", {
      headers: {
        cookie: "freya_session=token-valido"
      }
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      members: [
        {
          user_id: "user-123",
          email: "owner@example.com",
          name: "Owner",
          role: "owner",
          accepted_at: "2026-06-21T12:00:00.000Z"
        },
        {
          user_id: "user-456",
          email: "member@example.com",
          name: "Member",
          role: "member",
          accepted_at: null
        }
      ]
    });
    expect(queryMock.mock.calls[0]?.[0]).toContain("from project_members pm");
    expect(queryMock.mock.calls[0]?.[1]).toEqual(["site-1", "user-123"]);
  });

  it("falha com erro claro no invite quando o email ainda não existe", async () => {
    queryMock.mockResolvedValueOnce({
      rows: []
    });

    const { app } = await import("../index");
    const response = await app.request("/api/projects/site-1/invite", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: "freya_session=token-valido"
      },
      body: JSON.stringify({
        email: "novo@example.com"
      })
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "user_not_found",
      message: "Só é possível convidar um email já cadastrado."
    });
  });

  it("insere membership ao convidar um email existente", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [{ id: "user-456", email: "member@example.com", name: "Member" }]
      })
      .mockResolvedValueOnce({ rowCount: 1, rows: [] });

    const { app } = await import("../index");
    const response = await app.request("/api/projects/site-1/invite", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: "freya_session=token-valido"
      },
      body: JSON.stringify({
        email: "member@example.com"
      })
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      member: {
        id: "user-456",
        email: "member@example.com",
        name: "Member",
        role: "member"
      }
    });
    expect(queryMock.mock.calls[0]?.[0]).toContain("select id, email, name from users");
    expect(queryMock.mock.calls[0]?.[1]).toEqual(["member@example.com"]);
    expect(queryMock.mock.calls[1]?.[0]).toContain("insert into project_members");
    expect(queryMock.mock.calls[1]?.[1]).toEqual(["site-1", "user-456", "member"]);
  });

  it("lista páginas do projeto em GET /api/projects/:siteId/pages", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: "page-1",
          name: "Home",
          slug: "home",
          status: "draft",
          seo: { title: "Home", description: "Hero e CTA" },
          content: { sections: [] },
          block_types: [],
          order_idx: 0
        }
      ]
    });

    const { app } = await import("../index");
    const response = await app.request("/api/projects/site-1/pages", {
      headers: {
        cookie: "freya_session=token-valido"
      }
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      pages: [
        {
          id: "page-1",
          name: "Home",
          slug: "home",
          status: "draft",
          seo: { title: "Home", description: "Hero e CTA" },
          content: { sections: [] },
          block_types: [],
          order_idx: 0
        }
      ]
    });
    expect(queryMock.mock.calls[0]?.[0]).toContain("from pages p");
    expect(queryMock.mock.calls[0]?.[1]).toEqual(["site-1", "user-123"]);
  });

  it("retorna idiomas do projeto em GET /api/projects/:siteId/languages", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          languages: {
            default: "pt-BR",
            enabled: ["en"]
          }
        }
      ]
    });

    const { app } = await import("../index");
    const response = await app.request("/api/projects/site-1/languages", {
      headers: {
        cookie: "freya_session=token-valido"
      }
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      languages: {
        default: "pt-BR",
        enabled: ["pt-BR", "en"]
      }
    });
    expect(queryMock.mock.calls[0]?.[0]).toContain("select s.languages");
    expect(queryMock.mock.calls[0]?.[1]).toEqual(["site-1", "user-123"]);
  });

  it("habilita locale extra sem traduzir automaticamente", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            languages: {
              default: "pt-BR",
              enabled: ["pt-BR"]
            }
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            languages: {
              default: "pt-BR",
              enabled: ["pt-BR", "en"]
            }
          }
        ]
      });

    const { app } = await import("../index");
    const response = await app.request("/api/projects/site-1/languages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: "freya_session=token-valido"
      },
      body: JSON.stringify({ locale: "en" })
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      languages: {
        default: "pt-BR",
        enabled: ["pt-BR", "en"]
      }
    });
    expect(queryMock).toHaveBeenCalledTimes(2);
    expect(queryMock.mock.calls[0]?.[0]).toContain("select s.languages");
    expect(queryMock.mock.calls[1]?.[0]).toContain("update sites s set languages");
    expect(queryMock.mock.calls[1]?.[1]).toEqual([
      "site-1",
      JSON.stringify({
        default: "pt-BR",
        enabled: ["pt-BR", "en"]
      }),
      "user-123"
    ]);
  });

  it("cria página em branco em POST /api/projects/:siteId/pages", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            languages: {
              default: "pt-BR",
              enabled: ["pt-BR"]
            }
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            default_locale: "pt-BR",
            slug: "home",
            id: "page-1"
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [{ next_order: 3 }]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "page-2",
            site_id: "site-1",
            name: "Contato",
            slug: "contato",
            status: "draft",
            content: { sections: [] },
            seo: {
              title: "",
              description: "",
              ogImage: "",
              canonical: "/contato"
            },
            block_types: [],
            order_idx: 3
          }
        ]
      });

    const { app } = await import("../index");
    const response = await app.request("/api/projects/site-1/pages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: "freya_session=token-valido"
      },
      body: JSON.stringify({
        name: "Contato",
        strategy: "blank",
        followVisualModel: false
      })
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      page: {
        id: "page-2",
        site_id: "site-1",
        name: "Contato",
        slug: "contato",
        status: "draft",
        content: { sections: [] },
        seo: {
          title: "",
          description: "",
          ogImage: "",
          canonical: "/contato"
        },
        block_types: [],
        order_idx: 3
      }
    });
    expect(queryMock.mock.calls[0]?.[0]).toContain("select s.languages");
    expect(queryMock.mock.calls[0]?.[1]).toEqual(["site-1", "user-123"]);
    expect(queryMock.mock.calls[1]?.[0]).toContain("select p.id, p.slug");
    expect(queryMock.mock.calls[1]?.[1]).toEqual(["site-1", "user-123"]);
    expect(queryMock.mock.calls[2]?.[0]).toContain("max(order_idx)");
    expect(queryMock.mock.calls[2]?.[1]).toEqual(["site-1", "user-123"]);
    expect(queryMock.mock.calls[3]?.[0]).toContain("insert into pages");
    expect(queryMock.mock.calls[3]?.[1]?.[0]).toBe("site-1");
    expect(queryMock.mock.calls[3]?.[1]?.[1]).toBe("Contato");
    expect(queryMock.mock.calls[3]?.[1]?.[2]).toBe("contato");
  });

  it("bloqueia criação quando slug do locale já existe no site", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            languages: {
              default: "pt-BR",
              enabled: ["pt-BR", "en"]
            }
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "page-1",
            slug: "contato",
            default_locale: "pt-BR"
          }
        ]
      });

    const { app } = await import("../index");
    const response = await app.request("/api/projects/site-1/pages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: "freya_session=token-valido"
      },
      body: JSON.stringify({
        name: "Contato",
        slug: {
          "pt-BR": "contato",
          en: "contact"
        }
      })
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "slug_conflict",
      message: "Já existe uma página com o slug \"contato\" no locale \"pt-BR\"."
    });
    expect(queryMock).toHaveBeenCalledTimes(2);
  });

  it("bloqueia publish sem SEO mínimo em POST /api/projects/:siteId/pages/:pageId/status", async () => {
    const { app } = await import("../index");
    const response = await app.request("/api/projects/site-1/pages/page-1/status", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: "freya_session=token-valido"
      },
      body: JSON.stringify({
        status: "published",
        seo: { title: "", description: "" }
      })
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "seo_required",
      message: "Preencha SEO title e SEO description antes de publicar."
    });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("atualiza SEO por página em POST /api/projects/:siteId/pages/:pageId/seo", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: "page-1",
          seo: {
            title: "Contato",
            description: "Fale com o time",
            ogImage: "",
            canonical: "/contato"
          }
        }
      ]
    });

    const { app } = await import("../index");
    const response = await app.request("/api/projects/site-1/pages/page-1/seo", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: "freya_session=token-valido"
      },
      body: JSON.stringify({
        title: "  Contato  ",
        description: "  Fale com o time  ",
        canonical: "   "
      })
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      page: {
        id: "page-1",
        seo: {
          title: "Contato",
          description: "Fale com o time",
          ogImage: "",
          canonical: "/contato"
        }
      }
    });
    expect(queryMock.mock.calls[0]?.[0]).toContain("update pages");
    expect(queryMock.mock.calls[0]?.[1]?.[0]).toBe("site-1");
    expect(queryMock.mock.calls[0]?.[1]?.[1]).toBe("page-1");
  });

  it("aceita tradução explícita por página", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            id: "page-1",
            content: {
              sections: [
                {
                  id: "section-1",
                  type: "hero",
                  animationPreset: null,
                  props: {},
                  blocks: [
                    {
                      id: "block-1",
                      type: "text",
                      animationPreset: null,
                      persuasion: null,
                      props: { content: "Olá" }
                    }
                  ]
                }
              ]
            },
            languages: {
              default: "pt-BR",
              enabled: ["pt-BR", "en"]
            }
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "page-1",
            content: {
              sections: [
                {
                  id: "section-1",
                  type: "hero",
                  animationPreset: null,
                  props: {},
                  blocks: [
                    {
                      id: "block-1",
                      type: "text",
                      animationPreset: null,
                      persuasion: null,
                      props: {},
                      i18n: {
                        "pt-BR": {
                          content: "Olá",
                          ai_generated: false
                        },
                        en: {
                          content: "Olá",
                          ai_generated: true
                        }
                      }
                    }
                  ]
                }
              ]
            }
          }
        ]
      });

    const { app } = await import("../index");
    const response = await app.request("/api/projects/site-1/pages/page-1/translate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: "freya_session=token-valido"
      },
      body: JSON.stringify({
        sourceLocale: "pt-BR",
        targetLocale: "en",
        triggeredByUser: true
      })
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      page: {
        id: "page-1",
        content: {
          sections: [
            {
              id: "section-1",
              type: "hero",
              animationPreset: null,
              props: {},
              blocks: [
                {
                  id: "block-1",
                  type: "text",
                  animationPreset: null,
                  persuasion: null,
                  props: {},
                  i18n: {
                    "pt-BR": {
                      content: "Olá",
                      ai_generated: false
                    },
                    en: {
                      content: "Olá",
                      ai_generated: true
                    }
                  }
                }
              ]
            }
          ]
        }
      }
    });
    expect(queryMock.mock.calls[0]?.[0]).toContain("select p.id, p.content, s.languages");
    expect(queryMock.mock.calls[1]?.[0]).toContain("update pages p set content = $3::jsonb");
    expect(queryMock.mock.calls[1]?.[1]?.[0]).toBe("site-1");
    expect(queryMock.mock.calls[1]?.[1]?.[1]).toBe("page-1");
  });

  it("não traduz página quando triggeredByUser=false", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: "page-1",
          content: { sections: [] },
          languages: {
            default: "pt-BR",
            enabled: ["pt-BR", "en"]
          }
        }
      ]
    });

    const { app } = await import("../index");
    const response = await app.request("/api/projects/site-1/pages/page-1/translate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: "freya_session=token-valido"
      },
      body: JSON.stringify({
        sourceLocale: "pt-BR",
        targetLocale: "en",
        triggeredByUser: false
      })
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "invalid_request",
      message: "A tradução só pode ser executada por ação explícita do usuário."
    });
    expect(queryMock).toHaveBeenCalledTimes(1);
  });

  it("sugere o padrão visual mais frequente em GET /api/projects/:siteId/pages/suggestions/visual-pattern", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          content: {
            sections: [{ type: "hero" }, { type: "cards" }, { type: "cta" }]
          }
        },
        {
          content: {
            sections: [{ type: "hero" }, { type: "cards" }, { type: "cta" }]
          }
        },
        {
          content: {
            sections: [{ type: "hero" }, { type: "gallery" }]
          }
        }
      ]
    });

    const { app } = await import("../index");
    const response = await app.request("/api/projects/site-1/pages/suggestions/visual-pattern", {
      headers: {
        cookie: "freya_session=token-valido"
      }
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      suggestion: ["hero", "cards", "cta"]
    });
    expect(queryMock.mock.calls[0]?.[0]).toContain("where p.site_id = $1");
    expect(queryMock.mock.calls[0]?.[0]).toContain("p.status = 'published'");
    expect(queryMock.mock.calls[0]?.[1]).toEqual(["site-1", "user-123"]);
  });
});
