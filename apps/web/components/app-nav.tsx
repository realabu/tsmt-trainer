"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useRef, useState } from "react";
import { clearStoredAuth } from "../lib/auth-storage";
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
  { href: "/", label: "Iranyitopult", roles: ["PARENT", "TRAINER", "ADMIN"] },
  { href: "/children", label: "Gyerekek", roles: ["PARENT"] },
  { href: "/routines", label: "Feladatsorok", roles: ["PARENT"] },
  { href: "/trainer", label: "Trainer nezet", roles: ["TRAINER"] },
  { href: "/admin", label: "Admin", roles: ["ADMIN"] },
  { href: getApiDocsUrl(), label: "API docs", roles: ["PARENT", "TRAINER", "ADMIN"], external: true },
];

export function AppNav() {
  const user = useAuthUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const activeRole: NavRole = user?.role ?? "guest";
  const navItems = NAV_ITEMS.filter((item) => item.roles.includes(activeRole));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setProfileOpen(false);
  }, [user?.id]);

  const profileLabel = user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() : "";

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
          {user ? (
            <div className="profile-menu" ref={profileMenuRef}>
              <button
                aria-expanded={profileOpen}
                aria-label="Profil menü megnyitása"
                className="profile-menu-trigger"
                onClick={() => setProfileOpen((value) => !value)}
                type="button"
              >
                {profileLabel}
              </button>
              <div className={`profile-menu-dropdown ${profileOpen ? "open" : ""}`}>
                <div className="profile-menu-summary">
                  <strong>
                    {user.firstName} {user.lastName}
                  </strong>
                  <span className="muted">{user.email}</span>
                  <span className="muted">
                    {user.role === "PARENT" ? "Szulo" : user.role === "TRAINER" ? "Trainer" : "Admin"}
                  </span>
                </div>
                <Link
                  href={"/profile" as Route}
                  className="profile-menu-item"
                  onClick={() => setProfileOpen(false)}
                >
                  Sajat profil
                </Link>
                <button
                  className="profile-menu-item danger"
                  onClick={() => {
                    setProfileOpen(false);
                    clearStoredAuth();
                  }}
                  type="button"
                >
                  Kijelentkezes
                </button>
              </div>
            </div>
          ) : null}
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
          {user ? (
            <>
              <Link
                href={"/profile" as Route}
                className="app-nav-link"
                onClick={() => setMobileOpen(false)}
              >
                Sajat profil
              </Link>
              <button
                className="app-nav-link app-nav-mobile-logout"
                onClick={() => {
                  setMobileOpen(false);
                  clearStoredAuth();
                }}
                type="button"
              >
                Kijelentkezes
              </button>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
