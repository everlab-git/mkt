export type MemberRole = "owner" | "member";

export function normalizeMemberRole(value: string): MemberRole {
  return value === "owner" ? "owner" : "member";
}

export function canInviteExistingUserOnly(userExists: boolean): boolean {
  return userExists;
}
