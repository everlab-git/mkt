export function isWithinRequestCodeLimit(count: number): boolean {
  return count <= 3;
}

export function isWithinVerifyLimit(count: number): boolean {
  return count <= 5;
}
