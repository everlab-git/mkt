import { useSiteTheme } from "../../theme/ThemeContext";
import type { PersuasionResult } from "../persuasion/registry";

export interface TableBlockProps {
  columns: string[];
  rows: Array<Array<string | number>>;
  caption?: string;
  persuasion?: PersuasionResult | null;
}

export function TableBlock({
  columns,
  rows,
  caption,
  persuasion = null
}: TableBlockProps) {
  const theme = useSiteTheme();

  return (
    <div
      style={{
        overflowX: "auto",
        borderRadius: 24,
        border: `1px solid color-mix(in srgb, ${theme.palette.accent} 26%, transparent)`,
        background: colorSurface(theme.palette.background, theme.palette.primary)
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          color: theme.palette.text,
          fontFamily: theme.typography.body
        }}
      >
        {caption ? (
          <caption
            style={{
              padding: 16,
              textAlign: "left",
              fontFamily: theme.typography.heading,
              opacity: persuasion?.highlighted ? 1 : 0.86
            }}
          >
            {caption}
          </caption>
        ) : null}
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                scope="col"
                style={{
                  padding: "14px 16px",
                  textAlign: "left",
                  borderBottom: `1px solid color-mix(in srgb, ${theme.palette.accent} 24%, transparent)`,
                  fontFamily: theme.typography.heading
                }}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td
                  key={`cell-${rowIndex}-${cellIndex}`}
                  style={{
                    padding: "14px 16px",
                    borderBottom: `1px solid color-mix(in srgb, ${theme.palette.accent} 14%, transparent)`,
                    opacity: 0.88
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function colorSurface(background: string, primary: string) {
  return `linear-gradient(180deg, color-mix(in srgb, ${primary} 72%, ${background}), ${background})`;
}
