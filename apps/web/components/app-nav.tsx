"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";
import { getApiDocsUrl } from "../lib/api";
import { useAuthUser } from "../lib/use-auth-user";

type NavRole = "guest" | "PARENT" | "TRAINER" | "ADMIN";

interface NavItem {
  href: string;
  label: string;
  roles: NavRole[];
  external?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/szuloknek", label: "Szuloknek", roles: ["guest"] },
  { href: "/trainereknek", label: "Trainereknek", roles: ["guest"] },
  { href: "/children", label: "Gyerekek", roles: ["PARENT"] },
  { href: "/routines", label: "Feladatsorok", roles: ["PARENT"] },
  { href: "/trainer", label: "Trainer nezet", roles: ["TRAINER"] },
  { href: "/admin", label: "Admin", roles: ["ADMIN"] },
  { href: getApiDocsUrl(), label: "API docs", roles: ["PARENT", "TRAINER", "ADMIN"], external: true },
];

export function AppNav() {
  const user = useAuthUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeRole: NavRole = user?.role ?? "guest";
  const navItems = NAV_ITEMS.filter((item) => item.roles.includes(activeRole));

  return (
    <nav className={`app-nav ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="app-nav-inner">
        <Link href="/" className="app-nav-brand" onClick={() => setMobileOpen(false)}>
          TSMT Trainer
        </Link>

        <button
          aria-expanded={mobileOpen}
          aria-label="Menü megnyitása"
          className="app-nav-toggle"
          onClick={() => setMobileOpen((value) => !value)}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>

        <div className="app-nav-links desktop">
          {navItems.map((item) =>
            item.external ? (
              <a href={item.href} className="app-nav-link" key={item.href}>
                {item.label}
              </a>
            ) : (
              <Link href={item.href as Route} className="app-nav-link" key={item.href}>
                {item.label}
              </Link>
            ),
          )}
        </div>
      </div>

      <div className={`app-nav-mobile-panel ${mobileOpen ? "open" : ""}`}>
        <div className="app-nav-mobile-links">
          {navItems.map((item) =>
            item.external ? (
              <a
                href={item.href}
                className="app-nav-link"
                key={item.href}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </a>
            ) : (
              <Link
                href={item.href as Route}
                className="app-nav-link"
                key={item.href}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ),
          )}
        </div>
      </div>
    </nav>
  );
}
