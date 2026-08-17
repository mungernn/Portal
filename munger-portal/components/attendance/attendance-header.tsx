"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { attendanceLogout, ATTENDANCE_ROLE_LABELS, type AttendanceUserInfo } from "@/lib/attendance-auth";

export function AttendanceHeader({ user }: { user: AttendanceUserInfo }) {
  const router = useRouter();

  function handleLogout() {
    attendanceLogout();
    router.push("/attendance-login");
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
        <Link href="/attendance-login" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-nnm-blue font-display text-sm font-bold text-nnm-gold">
            M
          </span>
          <span className="text-sm font-semibold text-slate-900">Field Staff Attendance</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-right text-sm leading-tight text-slate-500">
            {user.displayName}
            <span className="block text-xs text-slate-400">
              {ATTENDANCE_ROLE_LABELS[user.role]}
              {user.wardName ? ` - ${user.wardName}` : ""}
            </span>
          </span>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
