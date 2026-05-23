"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface UseCheckAccessOptions {
  requiredRoles?: string[];
  redirectTo?: string;
  showError?: boolean;
}

export function useCheckAccess(options: UseCheckAccessOptions = {}) {
  const {
    requiredRoles = [],
    redirectTo = "/",
    showError = true,
  } = options;

  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (!response.ok) {
          router.push("/login");
          return;
        }

        const session = await response.json();
        const role = session.role;
        setUserRole(role);

        // If no required roles specified, all authenticated users have access
        if (requiredRoles.length === 0) {
          setHasAccess(true);
        } else {
          // Check if user's role is in the required roles
          const hasRequiredRole = requiredRoles.includes(role);
          setHasAccess(hasRequiredRole);

          if (!hasRequiredRole && showError) {
            // Redirect if user doesn't have access
            router.push(redirectTo);
          }
        }
      } catch (error) {
        console.error("Error checking access:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [requiredRoles, redirectTo, showError, router]);

  return {
    userRole,
    hasAccess,
    loading,
    canAccess: hasAccess && !loading,
  };
}
