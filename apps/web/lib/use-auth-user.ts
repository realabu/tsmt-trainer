"use client";

import { useEffect, useState } from "react";
import { AUTH_CHANGED_EVENT, getStoredAuthUser, type StoredAuthUser } from "./auth-storage";

export function useAuthUser() {
  const [user, setUser] = useState<StoredAuthUser | null>(null);

  useEffect(() => {
    function syncUser() {
      setUser(getStoredAuthUser());
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
    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    };
  }, []);

  return user;
}
