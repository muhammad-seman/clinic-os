"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type Ctx = {
  collapsed: boolean;
  mobileOpen: boolean;
  toggle: () => void;
  closeMobile: () => void;
};

const ShellCtx = createContext<Ctx | null>(null);

export function useShell(): Ctx {
  const v = useContext(ShellCtx);
  if (!v) throw new Error("useShell must be used inside <AppShell>");
  return v;
}

const STORAGE_KEY = "ns:sidebar-collapsed";
const MOBILE_BREAKPOINT = 900;

export function AppShell({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "1") setCollapsed(true);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {}
  }, [collapsed]);

  const toggle = useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth <= MOBILE_BREAKPOINT) {
      setMobileOpen((v) => !v);
    } else {
      setCollapsed((v) => !v);
    }
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <ShellCtx.Provider value={{ collapsed, mobileOpen, toggle, closeMobile }}>
      <div
        className="app"
        data-collapsed={collapsed ? "true" : undefined}
        data-mobile-open={mobileOpen ? "true" : undefined}
      >
        {sidebar}
        <div className="main">{children}</div>
        {mobileOpen && <div className="mobile-scrim" onClick={closeMobile} />}
      </div>
    </ShellCtx.Provider>
  );
}

export function SidebarToggleButton() {
  const { toggle, collapsed } = useShell();
  return (
    <button
      type="button"
      className="menu-btn"
      onClick={toggle}
      aria-label={collapsed ? "Buka sidebar" : "Ciutkan sidebar"}
      title={collapsed ? "Buka sidebar" : "Ciutkan sidebar"}
    >
      <svg
        width={14}
        height={14}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {collapsed ? (
          <path d="m13 6 6 6-6 6M5 6l6 6-6 6" />
        ) : (
          <path d="M11 6 5 12l6 6M19 6l-6 6 6 6" />
        )}
      </svg>
    </button>
  );
}
