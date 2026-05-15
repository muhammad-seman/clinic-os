export type RoleSnapshot = { slug: string; permissions: ReadonlySet<string> };

export function can(role: RoleSnapshot, key: string): boolean {
  return role.permissions.has(key);
}

export function canAny(role: RoleSnapshot, keys: string[]): boolean {
  return keys.some((k) => role.permissions.has(k));
}
