export function suggestVisualPattern(patterns: string[][]): string[] {
  const counter = new Map<string, number>();

  for (const pattern of patterns) {
    const key = pattern.join("::");
    counter.set(key, (counter.get(key) ?? 0) + 1);
  }

  const winner = [...counter.entries()].sort((a, b) => b[1] - a[1])[0];
  return winner ? winner[0].split("::").filter(Boolean) : [];
}
