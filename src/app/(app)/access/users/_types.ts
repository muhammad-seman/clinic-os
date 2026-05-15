export type UserRow = {
  id: string;
  email: string;
  name: string;
  status: "active" | "pending" | "locked" | "disabled";
  totpEnabled: boolean;
  roleSlug: string;
  joined: string;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
};

export type RoleOpt = { id: string; slug: string; label: string; isSystem: boolean };

export type BulkAction = "delete" | "disable" | "lock";

export const PAGE_SIZES = [10, 25, 50, 100];
