"use client";

import { useEffect, useState } from "react";

export type UserRole = "ADMIN" | "ADMIN_MANAGER" | "STORE_MANAGER" | "EMPLOYEE" | "SUB_STORE_LOGIN" | "INWARD_PERSON" | "OUTWARD_PERSON" | null;

export function useUserRole() {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) {
          setRole(d.role as UserRole);
        }
      })
      .catch(() => setRole(null))
      .finally(() => setLoading(false));
  }, []);

  return { 
    role, 
    loading, 
    isAdmin: role === "ADMIN",
    isAdminManager: role === "ADMIN_MANAGER",
    isStoreManager: role === "STORE_MANAGER",
    isEmployee: role === "EMPLOYEE",
    isSubStoreLogin: role === "SUB_STORE_LOGIN",
    isInwardPerson: role === "INWARD_PERSON",
    isOutwardPerson: role === "OUTWARD_PERSON",
    hasFullAccess: ["ADMIN", "ADMIN_MANAGER", "STORE_MANAGER"].includes(role || ""),
    hasAdminAccess: role === "ADMIN",
  };
}
