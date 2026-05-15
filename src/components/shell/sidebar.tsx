import { NAV } from "./nav";
import { NavItem } from "./nav-item.client";
import type { RoleSnapshot } from "@/lib/rbac/check";
import type { SidebarBadges } from "@/server/services/shell/badges";

const ROLE_DEF: Record<string, { label: string; short: string; color: string }> = {
  superadmin: { label: "Superadmin", short: "SA", color: "#b8956a" },
  owner: { label: "Owner", short: "OW", color: "#5a7d6f" },
  admin: { label: "Admin", short: "AD", color: "#1f3a6b" },
  staff: { label: "Karyawan", short: "KR", color: "#a86973" },
  dokter: { label: "Dokter", short: "DR", color: "#1f3a6b" },
  terapis: { label: "Terapis", short: "TR", color: "#5a7d6f" },
};

const MATCH_PREFIX: Record<string, string> = {
  master: "/master",
  users: "/access/users",
  roles: "/access/roles",
  audit: "/access/audit",
  sessions: "/access/sessions",
};

export function Sidebar({
  role,
  user,
  badges,
}: {
  role: RoleSnapshot;
  user: { name: string };
  badges: SidebarBadges;
}) {
  const visible = NAV.filter((n) => role.permissions.has(`${n.id}.view`));
  const grouped = visible.reduce<Record<string, typeof NAV>>((acc, n) => {
    (acc[n.group] ??= []).push(n);
    return acc;
  }, {});
  const def = ROLE_DEF[role.slug] ?? ROLE_DEF.admin!;
  const badgeMap: Record<string, number> = {
    stock: badges.stock,
    calendar: badges.calendar,
    piutang: badges.piutang,
  };

  return (
    <aside className="side">
      <div className="side-brand">
        <div className="mark">NS</div>
        <div className="name">
          NS Aesthetic<small>Clinic OS</small>
        </div>
      </div>
      <nav className="side-nav">
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group}>
            <div className="side-section">{group}</div>
            {items.map((n) => (
              <NavItem
                key={n.id}
                href={n.href}
                icon={n.icon}
                label={n.label}
                badge={badgeMap[n.id] ?? 0}
                badgeAlt={n.id !== "stock"}
                matchPrefix={MATCH_PREFIX[n.id] ?? n.href}
                status={n.status}
              />
            ))}
          </div>
        ))}
      </nav>
      <div className="side-foot">
        <div className="avatar" style={{ background: def.color }}>
          {def.short}
        </div>
        <div className="meta">
          <b>{user.name}</b>
          <small>{def.label}</small>
        </div>
      </div>
    </aside>
  );
}
