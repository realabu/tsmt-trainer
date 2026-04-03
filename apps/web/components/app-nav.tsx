"use client";

import Link from "next/link";
import { useAuthUser } from "../lib/use-auth-user";

export function AppNav() {
  const user = useAuthUser();
  const isTrainer = user?.role === "TRAINER";
  const isAdmin = user?.role === "ADMIN";

  return (
    <nav className="app-nav">
      <div className="shell app-nav-inner">
        <Link href="/" className="app-nav-brand">
          TSMT Trainer
        </Link>
        <div className="app-nav-links">
          {user && !isTrainer && !isAdmin ? (
            <>
              <Link href="/children" className="app-nav-link">
                Gyerekek
              </Link>
              <Link href="/routines" className="app-nav-link">
                Feladatsorok
              </Link>
            </>
          ) : null}
          {isTrainer ? (
            <Link href="/trainer" className="app-nav-link">
              Trainer nezet
            </Link>
          ) : null}
          {isAdmin ? (
            <Link href="/admin" className="app-nav-link">
              Admin
            </Link>
          ) : null}
          {user ? (
            <a href="http://localhost:4000/api/docs" className="app-nav-link">
              API docs
            </a>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
