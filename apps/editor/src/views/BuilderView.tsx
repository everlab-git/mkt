import type { CSSProperties, Dispatch } from "react";
import type { AppState, SectionType } from "../state/types";
import type { Action } from "../state/actions";
import { colors, radius, spacing } from "../design-system/tokens";

const panelStyle: CSSProperties = {
  background: colors.base,
  border: `1px solid ${colors.bdr}`,
  borderRadius: radius.lg,
  padding: spacing[4],
  height: "calc(100vh - 88px)",
  overflow: "auto"
};

const buttonStyle: CSSProperties = {
  width: "100%",
  textAlign: "left",
  padding: "10px 12px",
  borderRadius: radius.md,
  border: `1px solid ${colors.bdr}`,
  background: colors.surface,
  color: colors.t1,
  cursor: "pointer"
};

const SECTION_LIBRARY: Array<{ type: SectionType; label: string }> = [
  { type: "hero", label: "Hero" },
  { type: "cards", label: "Cards" },
  { type: "cta", label: "CTA" },
  { type: "form", label: "Formulário" },
  { type: "video", label: "Vídeo" }
];

export function BuilderView({
  state,
  dispatch
}: {
  state: AppState;
  dispatch: Dispatch<Action>;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "280px 1fr 320px",
        gap: spacing[4]
      }}
    >
      <aside style={panelStyle}>
        <h3 style={{ margin: 0, color: colors.t1, fontSize: 14, letterSpacing: "0.02em" }}>
          Biblioteca
        </h3>
        <div style={{ height: 8 }} />
        {SECTION_LIBRARY.map((s) => (
          <div key={s.type} style={{ marginBottom: 10 }}>
            <button
              style={buttonStyle}
              onClick={() => dispatch({ type: "ADD_SECTION", stype: s.type })}
            >
              + {s.label}
            </button>
          </div>
        ))}
      </aside>

      <main
        style={{
          ...panelStyle,
          background: colors.bg,
          borderStyle: "dashed"
        }}
      >
        <h3 style={{ margin: 0, color: colors.t1, fontSize: 14, letterSpacing: "0.02em" }}>
          Canvas
        </h3>
        <div style={{ height: 12 }} />
        {state.sections.length === 0 ? (
          <div style={{ color: colors.t3 }}>Arraste/adicione uma seção para começar.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {state.sections.map((s, idx) => {
              const selected = state.selSectionId === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => dispatch({ type: "SELECT_SECTION", id: s.id })}
                  style={{
                    border: `1px solid ${selected ? colors.bdrA : colors.bdr}`,
                    borderRadius: radius.lg,
                    padding: 14,
                    background: colors.base,
                    cursor: "pointer"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ color: colors.t1, fontWeight: 600 }}>
                        {idx + 1}. {s.type}
                      </div>
                      <div style={{ color: colors.t3, fontSize: 12 }}>transition: {s.transition}</div>
                    </div>
                    <button
                      style={{
                        border: `1px solid ${colors.bdr}`,
                        background: colors.surface,
                        color: colors.t2,
                        borderRadius: radius.md,
                        padding: "6px 10px",
                        cursor: "pointer"
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch({ type: "REMOVE_SECTION", id: s.id });
                      }}
                      aria-label="Remover seção"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <aside style={panelStyle}>
        <h3 style={{ margin: 0, color: colors.t1, fontSize: 14, letterSpacing: "0.02em" }}>
          Propriedades
        </h3>
        <div style={{ height: 12 }} />
        {state.selSectionId ? (
          <div style={{ color: colors.t2, lineHeight: 1.6 }}>
            Seção selecionada: <code style={{ color: colors.t1 }}>{state.selSectionId}</code>
            <div style={{ height: 8 }} />
            (Próximo: transições, camadas e CSS conforme o spec.)
          </div>
        ) : (
          <div style={{ color: colors.t3 }}>Selecione uma seção no canvas.</div>
        )}
      </aside>
    </div>
  );
}

