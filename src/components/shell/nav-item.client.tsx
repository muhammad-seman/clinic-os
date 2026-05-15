"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";

export function NavItem({
  href,
  icon,
  label,
  badge,
  badgeAlt,
  matchPrefix,
  status,
}: {
  href: string;
  icon: string;
  label: string;
  badge?: number;
  badgeAlt?: boolean;
  matchPrefix: string;
  status?: "done" | "wip";
}) {
  const path = usePathname() ?? "";
  const isActive = path.startsWith(matchPrefix);
  const hasBadge = !!badge && badge > 0 && !isActive;
  return (
    <Link href={href} className="nav-item" aria-current={isActive ? "page" : undefined}>
      <Icon name={icon as never} size={17} className="ico" />
      <span>{label}</span>
      {hasBadge ? (
        <span className={"badge " + (badgeAlt ? "alt" : "")}>{badge}</span>
      ) : status ? (
        <span className={"impl-tag " + status} title={status === "done" ? "Sudah diimplementasi" : "Belum diimplementasi"}>
          {status === "done" ? "✓" : "WIP"}
        </span>
      ) : null}
    </Link>
  );
}
