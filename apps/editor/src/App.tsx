import type { CSSProperties } from "react";
import { useEffect, useMemo, useReducer, useState } from "react";
import { colors, radius, spacing } from "./design-system/tokens";
import { initialState } from "./state/initial";
import { reducer } from "./state/reducer";
import { BuilderView } from "./views/BuilderView";

type Health = { ok: boolean; db?: boolean };

const rootStyle: CSSProperties = {
  fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  background: colors.bg,
  color: colors.t1,
  minHeight: "100vh",
  padding: spacing[4]
};

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const apiBase = useMemo(
    () => String(import.meta.env.VITE_API_URL || "").replace(/\/+$/, ""),
    []
  );
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!apiBase) return;
    fetch(`${apiBase}/api/health`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setHealth(data);
      })
      .catch(() => {
        if (!cancelled) setHealth({ ok: false });
      });
    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  return (
    <div style={rootStyle}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing[4],
          padding: `${spacing[3]} ${spacing[4]}`,
          border: `1px solid ${colors.bdr}`,
          borderRadius: radius.lg,
          background: colors.base,
          marginBottom: spacing[4]
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <div style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>Freya CMS</div>
          <div style={{ color: colors.t3, fontSize: 12 }}>Editor · scaffold</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ color: colors.t3, fontSize: 12 }}>API:</span>
          <code style={{ color: colors.t2, fontSize: 12 }}>{apiBase || "(vazio)"}</code>
          <span style={{ color: colors.t3, fontSize: 12 }}>health:</span>
          <code style={{ color: colors.t2, fontSize: 12 }}>
            {health
              ? `ok=${String(health.ok)}${health.db === undefined ? "" : ` db=${String(health.db)}`}`
              : "..."}
          </code>
        </div>
      </header>

      {state.view === "builder" ? (
        <BuilderView state={state} dispatch={dispatch} />
      ) : (
        <div style={{ color: colors.t2 }}>View ainda não implementada.</div>
      )}
    </div>
  );
}
