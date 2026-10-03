export const ADMIN_EMAILS = [
  "andywesonga@gmail.com",
  "khaliddina688@gmail.com",
  "rikashii069@gmail.com",
] as const;

export const ADMIN_DISPLAY_NAMES: Record<string, string> = {
  "andywesonga@gmail.com": "Andy",
  "khaliddina688@gmail.com": "Khalid",
  "rikashii069@gmail.com": "Rika",
};

export function isAuthorizedAdminEmail(email: string | undefined): boolean {
  return ADMIN_EMAILS.includes(
    (email ?? "").trim().toLowerCase() as (typeof ADMIN_EMAILS)[number],
  );
}

export function getAdminDisplayName(email: string | undefined): string | null {
  const normalizedEmail = (email ?? "").trim().toLowerCase();
  return ADMIN_DISPLAY_NAMES[normalizedEmail] ?? null;
}

export function isAuthorizedAdminUser(
  user: { role?: "admin" | "user"; email?: string } | null,
  authenticatedEmail: string | undefined,
): boolean {
  return Boolean(
    user?.role === "admin" &&
      isAuthorizedAdminEmail(authenticatedEmail) &&
      user.email?.trim().toLowerCase() === authenticatedEmail?.trim().toLowerCase(),
  );
}
