import { createHash, randomInt, timingSafeEqual } from "node:crypto";

export function generateLoginCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashLoginCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export async function compareLoginCode(code: string, hash: string): Promise<boolean> {
  const incoming = Buffer.from(hashLoginCode(code), "hex");
  const stored = Buffer.from(hash, "hex");

  return incoming.length === stored.length && timingSafeEqual(incoming, stored);
}
