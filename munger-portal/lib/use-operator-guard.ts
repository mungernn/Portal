"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getOperatorInfo, getOperatorToken, type OperatorInfo } from "@/lib/auth";

/**
 * Client-side only — this checks sessionStorage in the browser, so it
 * cannot stop someone from viewing page markup via view-source or a
 * direct API call. Real protection lives on the backend: every write
 * endpoint (POST /api/v1/properties/:holdingNo) requires and verifies
 * the JWT itself (see requireOperator middleware). This guard is purely
 * a UX convenience — bounce a logged-out operator back to the login
 * screen instead of showing them a broken form.
 */
export function useOperatorGuard(): OperatorInfo | null {
  const router = useRouter();
  const [operator, setOperator] = useState<OperatorInfo | null | undefined>(undefined);

  useEffect(() => {
    const token = getOperatorToken();
    const info = getOperatorInfo();
    if (!token || !info) {
      router.replace("/portal-login/operator");
      return;
    }
    setOperator(info);
  }, [router]);

  return operator ?? null;
}