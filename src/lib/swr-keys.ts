export type BookingFilter = { q?: string | undefined; cursor?: string | null | undefined; status?: string | undefined };
export type UserFilter = { q?: string | undefined; cursor?: string | null | undefined; role?: string | undefined };
export type AuditFilter = { q?: string | undefined; cursor?: string | null | undefined; action?: string | undefined };

export const K = {
  bookings: {
    list: (f: BookingFilter) => ["bookings", "list", f] as const,
    detail: (id: string) => ["bookings", "detail", { id }] as const,
  },
  users: {
    list: (f: UserFilter) => ["users", "list", f] as const,
    detail: (id: string) => ["users", "detail", { id }] as const,
  },
  audit: {
    list: (f: AuditFilter) => ["audit", "list", f] as const,
  },
  sessions: {
    list: (userId: string) => ["sessions", "list", { userId }] as const,
  },
  materials: {
    list: () => ["materials", "list"] as const,
  },
  attendance: {
    list: (f: { employeeId?: string; from?: string; to?: string }) =>
      ["attendance", "list", f] as const,
  },
} as const;
