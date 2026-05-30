const appStyle: React.CSSProperties = {
  fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  background: "#030610",
  color: "#dde1f0",
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24
};

export default function App() {
  return (
    <div style={appStyle}>
      <div style={{ maxWidth: 780 }}>
        <h1 style={{ margin: 0, fontSize: 32, letterSpacing: "-0.02em" }}>
          Freya CMS
        </h1>
        <p style={{ opacity: 0.7, lineHeight: 1.6 }}>
          Scaffold inicial do editor (React + Vite + TypeScript).
        </p>
        <p style={{ opacity: 0.7, lineHeight: 1.6 }}>
          API configurada em: <code>{import.meta.env.VITE_API_URL}</code>
        </p>
      </div>
    </div>
  );
}

