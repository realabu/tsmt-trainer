"use client";

import { useEffect, useState } from "react";

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "PARENT" | "TRAINER" | "ADMIN";
}

export function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    function syncUser() {
      try {
        const raw = window.localStorage.getItem("tsmt.user");
        if (!raw) {
          setUser(null);
          return;
        }
        setUser(JSON.parse(raw) as AuthUser);
      } catch {
        setUser(null);
      }
    }

    function handleStorage(event: StorageEvent) {
      if (!event.key || event.key === "tsmt.user") {
        syncUser();
      }
    }

    function handleAuthChanged() {
      syncUser();
    }

    syncUser();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("tsmt-auth-changed", handleAuthChanged);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("tsmt-auth-changed", handleAuthChanged);
    };
  }, []);

  return user;
}
