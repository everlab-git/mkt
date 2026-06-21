import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { SiteTheme } from "./resolveTheme";
import { resolveSiteTheme } from "./resolveTheme";

const ThemeContext = createContext<SiteTheme>(resolveSiteTheme());

export function ThemeProvider({
  theme,
  children
}: {
  theme?: Partial<SiteTheme>;
  children: ReactNode;
}) {
  return <ThemeContext.Provider value={resolveSiteTheme(theme)}>{children}</ThemeContext.Provider>;
}

export function useSiteTheme() {
  return useContext(ThemeContext);
}

