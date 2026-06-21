import Lenis from "lenis";

let lenisPromise: Promise<Lenis> | null = null;

export async function getLenisInstance(): Promise<Lenis> {
  if (!lenisPromise) {
    lenisPromise = Promise.resolve(
      new Lenis({
        smoothWheel: true,
        syncTouch: false
      })
    );
  }

  return lenisPromise;
}

export function resetLenisForTests(): void {
  lenisPromise = null;
}
