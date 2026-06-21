export const SESSION_COOKIE_NAME = "freya_session";

export function buildSessionCookie(
  token: string,
  maxAgeSeconds: number,
  secure: boolean
): string {
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure ? "; Secure" : ""}`;
}

export function clearSessionCookie(secure: boolean): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`;
}
