"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAttendanceUserInfo, getAttendanceToken, type AttendanceUserInfo, type AttendanceRole } from "@/lib/attendance-auth";

/**
 * Client-side only, same caveat as useOperatorGuard - real protection is
 * on the backend (requireAttendanceRole). This just bounces a logged-out
 * or wrong-role user back to the login screen instead of showing a
 * broken page. Pass allowedRoles to restrict a page to specific roles
 * (e.g. jamadar's own marking screen shouldn't be reachable by a driver
 * supervisor); omit it to allow any authenticated attendance user.
 */
export function useAttendanceGuard(allowedRoles?: AttendanceRole[]): AttendanceUserInfo | null {
  const router = useRouter();
  const [user, setUser] = useState<AttendanceUserInfo | null | undefined>(undefined);

  useEffect(() => {
    const token = getAttendanceToken();
    const info = getAttendanceUserInfo();
    if (!token || !info) {
      router.replace("/attendance-login");
      return;
    }
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(info.role)) {
      router.replace("/attendance-login");
      return;
    }
    setUser(info);
    // allowedRoles is an array literal at call sites - comparing by reference every render would loop; intentionally omitted from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return user ?? null;
}
