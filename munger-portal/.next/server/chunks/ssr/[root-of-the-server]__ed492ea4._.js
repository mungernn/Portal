module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[project]/lib/admin-auth.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ADMIN_ROLE_LABELS",
    ()=>ADMIN_ROLE_LABELS,
    "ADMIN_ROLE_ORDER",
    ()=>ADMIN_ROLE_ORDER,
    "adminLogin",
    ()=>adminLogin,
    "adminLogout",
    ()=>adminLogout,
    "getAdminInfo",
    ()=>getAdminInfo,
    "getAdminToken",
    ()=>getAdminToken
]);
const TOKEN_KEY = "nnm_admin_token";
const ADMIN_KEY = "nnm_admin_info";
const ADMIN_ROLE_LABELS = {
    tax_daroga: "Tax Daroga",
    mutation_nodal_clerk: "Mutation Nodal Clerk",
    deputy_commissioner: "City Manager / Deputy Municipal Commissioner",
    commissioner: "Municipal Commissioner"
};
const ADMIN_ROLE_ORDER = [
    "tax_daroga",
    "mutation_nodal_clerk",
    "deputy_commissioner",
    "commissioner"
];
const API_BASE_URL = ("TURBOPACK compile-time value", "http://localhost:4000/api/v1") || "http://localhost:4000/api/v1";
async function adminLogin(username, password) {
    const res = await fetch(`${API_BASE_URL}/admin/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username,
            password
        })
    });
    if (!res.ok) {
        if (res.status === 401) throw new Error("Incorrect username or password.");
        throw new Error("Login failed. Please try again.");
    }
    const data = await res.json();
    sessionStorage.setItem(TOKEN_KEY, data.token);
    sessionStorage.setItem(ADMIN_KEY, JSON.stringify(data.admin));
    return data.admin;
}
function getAdminToken() {
    if ("TURBOPACK compile-time truthy", 1) return null;
    //TURBOPACK unreachable
    ;
}
function getAdminInfo() {
    if ("TURBOPACK compile-time truthy", 1) return null;
    //TURBOPACK unreachable
    ;
    const raw = undefined;
}
function adminLogout() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_KEY);
}
}),
"[project]/components/admin-header.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AdminHeader",
    ()=>AdminHeader
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/log-out.mjs [app-ssr] (ecmascript) <export default as LogOut>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$admin$2d$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/admin-auth.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
function AdminHeader({ admin }) {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    function handleLogout() {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$admin$2d$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["adminLogout"])();
        router.push("/portal-login/admin");
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
        className: "border-b border-slate-200 bg-white",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                    href: "/admin/dashboard",
                    className: "flex items-center gap-2.5",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "flex h-8 w-8 items-center justify-center rounded-full bg-nnm-blue font-display text-sm font-bold text-nnm-gold",
                            children: "म"
                        }, void 0, false, {
                            fileName: "[project]/components/admin-header.tsx",
                            lineNumber: 20,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-sm font-semibold text-slate-900",
                            children: "NNM Admin Portal"
                        }, void 0, false, {
                            fileName: "[project]/components/admin-header.tsx",
                            lineNumber: 23,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/admin-header.tsx",
                    lineNumber: 19,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                    className: "hidden sm:block",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/admin/dashboard",
                        className: "text-sm font-semibold text-slate-500 hover:text-nnm-blue",
                        children: "Dashboard"
                    }, void 0, false, {
                        fileName: "[project]/components/admin-header.tsx",
                        lineNumber: 26,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/components/admin-header.tsx",
                    lineNumber: 25,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-right text-sm leading-tight text-slate-500",
                            children: [
                                admin.displayName,
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "block text-xs text-slate-400",
                                    children: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$admin$2d$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ADMIN_ROLE_LABELS"][admin.role]
                                }, void 0, false, {
                                    fileName: "[project]/components/admin-header.tsx",
                                    lineNumber: 33,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/admin-header.tsx",
                            lineNumber: 31,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: handleLogout,
                            className: "inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__["LogOut"], {
                                    className: "h-3.5 w-3.5"
                                }, void 0, false, {
                                    fileName: "[project]/components/admin-header.tsx",
                                    lineNumber: 39,
                                    columnNumber: 13
                                }, this),
                                "Log out"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/admin-header.tsx",
                            lineNumber: 35,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/admin-header.tsx",
                    lineNumber: 30,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/admin-header.tsx",
            lineNumber: 18,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/admin-header.tsx",
        lineNumber: 17,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/admin/stage-badge.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "StageBadge",
    ()=>StageBadge
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$admin$2d$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/admin-auth.ts [app-ssr] (ecmascript)");
;
;
function StageBadge({ status, currentStage }) {
    if (status === "approved") {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700",
            children: "Approved"
        }, void 0, false, {
            fileName: "[project]/components/admin/stage-badge.tsx",
            lineNumber: 7,
            columnNumber: 7
        }, this);
    }
    if (status === "rejected") {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700",
            children: [
                "Rejected at ",
                __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$admin$2d$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ADMIN_ROLE_LABELS"][currentStage]
            ]
        }, void 0, true, {
            fileName: "[project]/components/admin/stage-badge.tsx",
            lineNumber: 14,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700",
        children: [
            "With ",
            __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$admin$2d$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ADMIN_ROLE_LABELS"][currentStage]
        ]
    }, void 0, true, {
        fileName: "[project]/components/admin/stage-badge.tsx",
        lineNumber: 20,
        columnNumber: 5
    }, this);
}
}),
"[project]/lib/use-admin-guard.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAdminGuard",
    ()=>useAdminGuard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$admin$2d$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/admin-auth.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
function useAdminGuard() {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const [admin, setAdmin] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(undefined);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const token = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$admin$2d$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAdminToken"])();
        const info = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$admin$2d$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAdminInfo"])();
        if (!token || !info) {
            router.replace("/portal-login/admin");
            return;
        }
        setAdmin(info);
    }, [
        router
    ]);
    return admin ?? null;
}
}),
"[project]/lib/admin-shop-api.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "approveRentalApplication",
    ()=>approveRentalApplication,
    "approveShopAgreementRequest",
    ()=>approveShopAgreementRequest,
    "fetchPerSqftReport",
    ()=>fetchPerSqftReport,
    "fetchPrintableAgreementAdmin",
    ()=>fetchPrintableAgreementAdmin,
    "fetchPrintableDemandNoticeAdmin",
    ()=>fetchPrintableDemandNoticeAdmin,
    "fetchPrintableViolationNoticeAdmin",
    ()=>fetchPrintableViolationNoticeAdmin,
    "fetchRentalApplicationDetail",
    ()=>fetchRentalApplicationDetail,
    "fetchRentalApplications",
    ()=>fetchRentalApplications,
    "fetchShopAgreementRequestDetail",
    ()=>fetchShopAgreementRequestDetail,
    "fetchShopAgreementRequests",
    ()=>fetchShopAgreementRequests,
    "fetchShopDemandHistoryAdmin",
    ()=>fetchShopDemandHistoryAdmin,
    "fetchShopPaymentHistoryAdmin",
    ()=>fetchShopPaymentHistoryAdmin,
    "fetchShopReceiptReprintAdmin",
    ()=>fetchShopReceiptReprintAdmin,
    "fetchViolationNoticesAdmin",
    ()=>fetchViolationNoticesAdmin,
    "rejectRentalApplication",
    ()=>rejectRentalApplication,
    "rejectShopAgreementRequest",
    ()=>rejectShopAgreementRequest
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$admin$2d$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/admin-auth.ts [app-ssr] (ecmascript)");
;
const API_BASE_URL = ("TURBOPACK compile-time value", "http://localhost:4000/api/v1") || "http://localhost:4000/api/v1";
function authHeaders() {
    const token = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$admin$2d$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAdminToken"])();
    if (!token) throw new Error("Not logged in — please log in again.");
    return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
    };
}
async function fetchShopAgreementRequests(opts) {
    const params = new URLSearchParams();
    if (opts.status) params.set("status", opts.status);
    if (opts.myStage) params.set("myStage", "true");
    const res = await fetch(`${API_BASE_URL}/admin/shop-agreement-requests?${params.toString()}`, {
        headers: authHeaders()
    });
    if (!res.ok) throw new Error("Could not load shop agreement requests.");
    return res.json();
}
async function fetchShopAgreementRequestDetail(id) {
    const res = await fetch(`${API_BASE_URL}/admin/shop-agreement-requests/${id}`, {
        headers: authHeaders()
    });
    if (!res.ok) throw new Error("Could not load this request.");
    return res.json();
}
async function approveShopAgreementRequest(id, notes) {
    const res = await fetch(`${API_BASE_URL}/admin/shop-agreement-requests/${id}/approve`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
            notes
        })
    });
    if (!res.ok) {
        const body = await res.json().catch(()=>({}));
        throw new Error(body.error || "Could not approve this request.");
    }
    const data = await res.json();
    return data.request;
}
async function rejectShopAgreementRequest(id, notes) {
    const res = await fetch(`${API_BASE_URL}/admin/shop-agreement-requests/${id}/reject`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
            notes
        })
    });
    if (!res.ok) {
        const body = await res.json().catch(()=>({}));
        throw new Error(body.error || "Could not reject this request.");
    }
    const data = await res.json();
    return data.request;
}
async function fetchRentalApplications(opts) {
    const params = new URLSearchParams();
    if (opts.status) params.set("status", opts.status);
    if (opts.myStage) params.set("myStage", "true");
    const res = await fetch(`${API_BASE_URL}/admin/shop-rental-applications?${params.toString()}`, {
        headers: authHeaders()
    });
    if (!res.ok) throw new Error("Could not load rental applications.");
    return res.json();
}
async function fetchRentalApplicationDetail(id) {
    const res = await fetch(`${API_BASE_URL}/admin/shop-rental-applications/${id}`, {
        headers: authHeaders()
    });
    if (!res.ok) throw new Error("Could not load this application.");
    return res.json();
}
async function approveRentalApplication(id, notes) {
    const res = await fetch(`${API_BASE_URL}/admin/shop-rental-applications/${id}/approve`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
            notes
        })
    });
    if (!res.ok) {
        const body = await res.json().catch(()=>({}));
        throw new Error(body.error || "Could not approve this application.");
    }
    const data = await res.json();
    return data.application;
}
async function rejectRentalApplication(id, notes) {
    const res = await fetch(`${API_BASE_URL}/admin/shop-rental-applications/${id}/reject`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
            notes
        })
    });
    if (!res.ok) {
        const body = await res.json().catch(()=>({}));
        throw new Error(body.error || "Could not reject this application.");
    }
    const data = await res.json();
    return data.application;
}
async function fetchPerSqftReport() {
    const res = await fetch(`${API_BASE_URL}/admin/shops/per-sqft-report`, {
        headers: authHeaders()
    });
    if (!res.ok) throw new Error("Could not load the per-sqft rate report.");
    const data = await res.json();
    return data.entries;
}
async function fetchShopDemandHistoryAdmin(shopNo) {
    const res = await fetch(`${API_BASE_URL}/shops/${encodeURIComponent(shopNo)}/rent-demands/history`, {
        headers: authHeaders()
    });
    if (!res.ok) throw new Error("Could not load rent demand history.");
    const data = await res.json();
    return data.history;
}
async function fetchShopReceiptReprintAdmin(receiptNo) {
    const res = await fetch(`${API_BASE_URL}/shops/rent-payments/${encodeURIComponent(receiptNo)}/print`, {
        headers: authHeaders()
    });
    if (!res.ok) throw new Error("Could not load this receipt.");
    return res.json();
}
async function fetchShopPaymentHistoryAdmin(shopNo) {
    const res = await fetch(`${API_BASE_URL}/shops/${encodeURIComponent(shopNo)}/rent-payments/history`, {
        headers: authHeaders()
    });
    if (!res.ok) throw new Error("Could not load payment history.");
    const data = await res.json();
    return data.history;
}
async function fetchPrintableAgreementAdmin(agreementId) {
    const res = await fetch(`${API_BASE_URL}/shops/agreements/${agreementId}/print`, {
        headers: authHeaders()
    });
    if (!res.ok) throw new Error("Could not load the agreement.");
    return res.json();
}
async function fetchViolationNoticesAdmin(shopNo) {
    const res = await fetch(`${API_BASE_URL}/shops/${encodeURIComponent(shopNo)}/violation-notices`, {
        headers: authHeaders()
    });
    if (!res.ok) throw new Error("Could not load violation notices.");
    return res.json();
}
async function fetchPrintableDemandNoticeAdmin(demandNo) {
    const res = await fetch(`${API_BASE_URL}/shops/rent-demands/${encodeURIComponent(demandNo)}/print`, {
        headers: authHeaders()
    });
    if (!res.ok) throw new Error("Could not load the demand notice.");
    return res.json();
}
async function fetchPrintableViolationNoticeAdmin(id) {
    const res = await fetch(`${API_BASE_URL}/shops/violation-notices/${id}/print`, {
        headers: authHeaders()
    });
    if (!res.ok) throw new Error("Could not load this violation notice.");
    return res.json();
}
}),
"[project]/app/admin/shop-rental-applications/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ShopRentalApplicationsPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.mjs [app-ssr] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-alert.mjs [app-ssr] (ecmascript) <export default as AlertCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$admin$2d$header$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/admin-header.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$admin$2f$stage$2d$badge$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/admin/stage-badge.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$use$2d$admin$2d$guard$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/use-admin-guard.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$admin$2d$shop$2d$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/admin-shop-api.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
;
const STATUS_TABS = [
    {
        value: "pending",
        label: "Pending"
    },
    {
        value: "approved",
        label: "Approved"
    },
    {
        value: "rejected",
        label: "Rejected"
    },
    {
        value: "all",
        label: "All"
    }
];
function ShopRentalApplicationsPage() {
    const admin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$use$2d$admin$2d$guard$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAdminGuard"])();
    const [status, setStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("pending");
    const [myStageOnly, setMyStageOnly] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [applications, setApplications] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!admin) return;
        setApplications(null);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$admin$2d$shop$2d$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fetchRentalApplications"])({
            status: status === "all" ? undefined : status,
            myStage: myStageOnly
        }).then((r)=>setApplications(r.applications)).catch((err)=>setError(err instanceof Error ? err.message : "Could not load applications."));
    }, [
        admin,
        status,
        myStageOnly
    ]);
    if (!admin) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex min-h-screen items-center justify-center text-sm text-slate-400",
            children: "Loading…"
        }, void 0, false, {
            fileName: "[project]/app/admin/shop-rental-applications/page.tsx",
            lineNumber: 34,
            columnNumber: 12
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-slate-50",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$admin$2d$header$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AdminHeader"], {
                admin: admin
            }, void 0, false, {
                fileName: "[project]/app/admin/shop-rental-applications/page.tsx",
                lineNumber: 39,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "mx-auto max-w-4xl px-6 py-10",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "mb-1 text-2xl font-semibold text-slate-900",
                        children: "Shop Rental Applications"
                    }, void 0, false, {
                        fileName: "[project]/app/admin/shop-rental-applications/page.tsx",
                        lineNumber: 42,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mb-6 text-sm text-slate-500",
                        children: "New tenant applications for vacant shops. Moves through Stall Prabhari → Tax Daroga (NOC) → City Manager → Deputy Commissioner → Commissioner. The agreement is created automatically once fully approved."
                    }, void 0, false, {
                        fileName: "[project]/app/admin/shop-rental-applications/page.tsx",
                        lineNumber: 43,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-5 flex flex-wrap items-center justify-between gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-2",
                                children: STATUS_TABS.map((tab)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setStatus(tab.value),
                                        className: `rounded-md px-3 py-1.5 text-sm font-semibold ${status === tab.value ? "bg-nnm-blue text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-100"}`,
                                        children: tab.label
                                    }, tab.value, false, {
                                        fileName: "[project]/app/admin/shop-rental-applications/page.tsx",
                                        lineNumber: 51,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/app/admin/shop-rental-applications/page.tsx",
                                lineNumber: 49,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "flex items-center gap-2 text-sm text-slate-600",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "checkbox",
                                        checked: myStageOnly,
                                        onChange: (e)=>setMyStageOnly(e.target.checked),
                                        className: "h-4 w-4 rounded border-slate-300"
                                    }, void 0, false, {
                                        fileName: "[project]/app/admin/shop-rental-applications/page.tsx",
                                        lineNumber: 63,
                                        columnNumber: 13
                                    }, this),
                                    "Only show applications at my desk"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/admin/shop-rental-applications/page.tsx",
                                lineNumber: 62,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/admin/shop-rental-applications/page.tsx",
                        lineNumber: 48,
                        columnNumber: 9
                    }, this),
                    error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        role: "alert",
                        className: "mb-5 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                                className: "h-4 w-4 shrink-0"
                            }, void 0, false, {
                                fileName: "[project]/app/admin/shop-rental-applications/page.tsx",
                                lineNumber: 75,
                                columnNumber: 13
                            }, this),
                            error
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/admin/shop-rental-applications/page.tsx",
                        lineNumber: 74,
                        columnNumber: 11
                    }, this),
                    !applications ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 text-sm text-slate-400",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                className: "h-4 w-4 animate-spin"
                            }, void 0, false, {
                                fileName: "[project]/app/admin/shop-rental-applications/page.tsx",
                                lineNumber: 82,
                                columnNumber: 13
                            }, this),
                            "Loading…"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/admin/shop-rental-applications/page.tsx",
                        lineNumber: 81,
                        columnNumber: 11
                    }, this) : applications.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-slate-400",
                        children: "No applications here."
                    }, void 0, false, {
                        fileName: "[project]/app/admin/shop-rental-applications/page.tsx",
                        lineNumber: 86,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-3",
                        children: applications.map((a)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                href: `/admin/shop-rental-applications/${a.id}`,
                                className: "flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "font-mono text-sm font-semibold text-slate-900",
                                                children: [
                                                    a.shop_no,
                                                    " — ",
                                                    a.applicant_name
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/admin/shop-rental-applications/page.tsx",
                                                lineNumber: 96,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xs text-slate-500",
                                                children: [
                                                    "₹",
                                                    Number(a.proposed_monthly_rent).toLocaleString("en-IN"),
                                                    "/mo — requested by ",
                                                    a.requested_by,
                                                    " on",
                                                    " ",
                                                    new Date(a.requested_at).toLocaleDateString("en-IN")
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/admin/shop-rental-applications/page.tsx",
                                                lineNumber: 99,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/admin/shop-rental-applications/page.tsx",
                                        lineNumber: 95,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$admin$2f$stage$2d$badge$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["StageBadge"], {
                                        status: a.status,
                                        currentStage: a.current_stage
                                    }, void 0, false, {
                                        fileName: "[project]/app/admin/shop-rental-applications/page.tsx",
                                        lineNumber: 104,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, a.id, true, {
                                fileName: "[project]/app/admin/shop-rental-applications/page.tsx",
                                lineNumber: 90,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/app/admin/shop-rental-applications/page.tsx",
                        lineNumber: 88,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/admin/shop-rental-applications/page.tsx",
                lineNumber: 41,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/admin/shop-rental-applications/page.tsx",
        lineNumber: 38,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__ed492ea4._.js.map