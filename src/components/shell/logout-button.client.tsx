"use client";

import { useTransition } from "react";
import { Icon } from "@/components/ui/icon";
import { signOutAction } from "@/app/(app)/_actions/auth";

export function LogoutButton() {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="icon-btn"
      title="Keluar"
      aria-label="Keluar"
      disabled={pending}
      onClick={() => start(() => signOutAction())}
    >
      <Icon name="logout" size={16} />
    </button>
  );
}
