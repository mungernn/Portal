"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAdminInfo, getAdminToken, type AdminInfo } from "@/lib/admin-auth";

/**
 * Client-side only, same caveat as use-operator-guard.ts — real
 * protection is the backend's requireAdmin middleware on every
 * admin-only endpoint. This is just UX: bounce a logged-out admin back
 * to the login screen instead of showing a broken dashboard.
 */
export function useAdminGuard(): AdminInfo | null {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminInfo | null | undefined>(undefined);

  useEffect(() => {
    const token = getAdminToken();
    const info = getAdminInfo();
    if (!token || !info) {
      router.replace("/portal-login/admin");
      return;
    }
    setAdmin(info);
  }, [router]);

  return admin ?? null;
}