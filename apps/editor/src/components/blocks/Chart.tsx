import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { useSiteTheme } from "../../theme/ThemeContext";
import type { PersuasionResult } from "../persuasion/registry";

type ChartDatum = Record<string, string | number>;

interface ChartSeries {
  dataKey: string;
  color?: string;
}

export interface ChartBlockProps {
  data: ChartDatum[];
  xKey: string;
  series: ChartSeries[];
  height?: number;
  persuasion?: PersuasionResult | null;
}

export function ChartBlock({
  data,
  xKey,
  series,
  height = 280,
  persuasion = null
}: ChartBlockProps) {
  const theme = useSiteTheme();

  return (
    <div
      style={{
        width: "100%",
        height,
        minHeight: height,
        padding: 16,
        borderRadius: 24,
        border: `1px solid color-mix(in srgb, ${theme.palette.accent} 30%, transparent)`,
        background: `linear-gradient(180deg, color-mix(in srgb, ${theme.palette.primary} 78%, ${theme.palette.background}), ${theme.palette.background})`
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" />
          <XAxis dataKey={xKey} stroke={theme.palette.text} tickLine={false} axisLine={false} />
          <YAxis stroke={theme.palette.text} tickLine={false} axisLine={false} />
          <Tooltip />
          {series.map((item, index) => (
            <Bar
              key={item.dataKey}
              dataKey={item.dataKey}
              fill={item.color ?? (index === 0 || persuasion?.highlighted ? theme.palette.accent : theme.palette.primary)}
              radius={[10, 10, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
