"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { API_URL, authFetch, getAuthUser, logout, parseJson } from "@/lib/auth";
import {
    LayoutDashboard,
    Package,
    ClipboardList,
    LogOut,
    User,
    ShoppingBag,
    Bell,
    ChevronRight,
} from "lucide-react";
import type { AuthUser } from "@/lib/auth";

interface ProductRequestNotification {
    id: number;
    name: string;
    category: string;
    quantity: number;
    status?: string;
}

export default function UmkmLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);
    const [user] = useState<AuthUser | null>(typeof window === "undefined" ? null : getAuthUser());

    const [open, setOpen] = useState(false);
    const [requestCount, setRequestCount] = useState(0);
    const [requestNotifications, setRequestNotifications] = useState<ProductRequestNotification[]>([]);
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    useEffect(() => {
        const fetchRequestCount = async () => {
            try {
                const response = await authFetch(`${API_URL}/api/umkm-user/product-requests`);
                if (!response.ok) return;
                const requests = await parseJson<ProductRequestNotification[]>(response);
                const openRequests = requests.filter((request) => request.status === "open");
                setRequestCount(openRequests.length);
                setRequestNotifications(openRequests);
            } catch {
                setRequestCount(0);
                setRequestNotifications([]);
            }
        };

        fetchRequestCount();

        window.addEventListener("product-request-status-changed", fetchRequestCount);
        return () => window.removeEventListener("product-request-status-changed", fetchRequestCount);
    }, [pathname]);
    useEffect(() => {
        const handleClickOutside = () => {
            setOpen(false);
            setNotificationsOpen(false);
        };
        if (open || notificationsOpen) document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [open, notificationsOpen]);

    const handleScroll = (e: React.UIEvent<HTMLElement>) => {
        setIsScrolled(e.currentTarget.scrollTop > 10);
    };

    const bottomNavItems = [
        { name: "Beranda", href: "/umkm/dashboard", icon: LayoutDashboard },
        { name: "Produk", href: "/umkm/produk", icon: Package },
        { name: "Permintaan", href: "/umkm/request-produk", icon: ClipboardList, badge: requestCount },
        { name: "Titipan", href: "/umkm/penitipan", icon: Package },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-gray-50 pb-24 md:pb-28 lg:pb-28">
            {/* Top Header */}
            <header className={`fixed top-0 inset-x-0 z-40 h-14 flex items-center justify-between px-4 transition-all duration-300 ${
                isScrolled ? "bg-white/70 backdrop-blur-md shadow-sm" : "bg-white border-b border-transparent"
            }`}>
                <div className="flex items-center space-x-2">
                    <ShoppingBag className="text-secondary opacity-90" />
                    <span className="font-bold text-gray-800">SIM UMKM</span>
                </div>

                {/* USER + DROPDOWN */}
                <div className="relative flex items-center space-x-3">
                    {user && (
                        <>
                            <div className="relative">
                                <button
                                    type="button"
                                    aria-label="Notifikasi request produk"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setNotificationsOpen(!notificationsOpen);
                                        setOpen(false);
                                    }}
                                    className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-all cursor-pointer ${notificationsOpen ? "bg-blue-950 text-amber-300 shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                                >
                                    <Bell size={20} />
                                    {requestCount > 0 && (
                                        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-extrabold leading-none text-white">
                                            {requestCount > 99 ? "99+" : requestCount}
                                        </span>
                                    )}
                                </button>

                                {notificationsOpen && (
                                    <div
                                        className="fixed left-1/2 top-16 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 overflow-visible rounded-3xl border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.18)] sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-96 sm:max-w-none sm:translate-x-0 sm:rounded-2xl"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <span className="absolute -top-2 right-10 h-4 w-4 rotate-45 border-l border-t border-slate-200 bg-slate-50/95 sm:right-5" aria-hidden="true" />
                                        <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-4 sm:py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-950 text-amber-300 shadow-sm">
                                                    <Bell size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-extrabold text-slate-900">Request Produk</p>
                                                    <p className="mt-0.5 text-xs text-slate-500">Request terbuka untuk kamu.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-extrabold text-blue-800">{requestCount} baru</span>
                                            </div>
                                        </div>
                                        {requestNotifications.length > 0 ? (
                                            <div className="max-h-[calc(100vh-9rem)] overflow-y-auto sm:max-h-72">
                                                {requestNotifications.map((request) => (
                                                    <Link
                                                        key={request.id}
                                                        href={`/umkm/request-produk?id=${request.id}`}
                                                        onClick={() => {
                                                            setNotificationsOpen(false);
                                                            if (window.location.pathname === "/umkm/request-produk") {
                                                                window.dispatchEvent(new CustomEvent("product-request-focus", { detail: String(request.id) }));
                                                            }
                                                        }}
                                                        className="group flex items-center gap-3 border-b border-slate-100 px-5 py-4 transition-colors hover:bg-blue-50 cursor-pointer last:border-b-0 sm:px-4 sm:py-3"
                                                    >
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                                                            <ClipboardList size={18} />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <p className="truncate text-sm font-bold text-slate-800">{request.name}</p>
                                                                <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">Terbuka</span>
                                                            </div>
                                                            <p className="mt-1 text-xs text-slate-500">{request.category} · {request.quantity} unit</p>
                                                        </div>
                                                        <ChevronRight size={17} className="shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" />
                                                    </Link>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="px-5 py-10 text-center">
                                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                                    <Bell size={21} />
                                                </div>
                                                <p className="mt-3 text-sm font-bold text-slate-700">Belum ada request baru</p>
                                                <p className="mt-1 text-xs text-slate-500">Notifikasi request dari admin akan muncul di sini.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* ICON USER */}
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpen(!open);
                                }}
                                className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full cursor-pointer hover:bg-gray-200"
                            >
                                <User size={20} className="text-gray-600" />
                            </div>

                            {/* DROPDOWN */}
                            {open && (
                                <div className="absolute right-0 top-14 w-44 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
                                    
                                    <Link 
                                        href="/umkm/profile" 
                                        className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 text-sm"
                                    >
                                        <User size={16} />
                                        Profil
                                    </Link>

                                    <button
                                        onClick={async () => {
                                            await logout();
                                            window.location.href = "/login";
                                        }}
                                        className="w-full text-left flex items-center gap-2 px-4 py-3 hover:bg-red-50 text-sm text-red-600"
                                    >
                                        <LogOut size={16} />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </header>

            {/* Main Content Area */}
            <main
                className="flex-1 overflow-y-auto px-4 pb-6 pt-14 md:pb-8"
                onScroll={handleScroll}
            >
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav aria-label="Navigasi akun UMKM" className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 md:px-8 lg:px-10">
                <div className="mx-auto flex h-[4.25rem] max-w-md items-center justify-around gap-1 rounded-[1.6rem] border border-slate-200/80 bg-white/95 p-1.5 shadow-[0_12px_40px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:h-[4.75rem] sm:max-w-xl sm:gap-2 sm:rounded-[1.75rem] sm:p-2 md:h-20 md:max-w-2xl md:gap-3 md:px-3 lg:h-[5.25rem] lg:max-w-3xl lg:gap-4 lg:rounded-[1.9rem] lg:px-4">
                    {bottomNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                aria-current={isActive ? "page" : undefined}
                                className={`group relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5 transition-all duration-200 active:scale-95 ${
                                    isActive ? "text-blue-950" : "text-slate-500 hover:text-blue-950"
                                }`}
                            >
                                <span className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-200 sm:h-10 sm:w-10 md:h-11 md:w-11 lg:h-12 lg:w-12 ${isActive ? "-translate-y-3 border-white bg-blue-950 text-amber-400 shadow-[0_8px_18px_rgba(15,23,42,0.28)] ring-1 ring-blue-100" : "border-transparent bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-950"}`}>
                                        <Icon className="h-[19px] w-[19px] sm:h-5 sm:w-5 md:h-[22px] md:w-[22px] lg:h-6 lg:w-6" strokeWidth={isActive ? 2.6 : 2.2} />
                                        {typeof item.badge === "number" && item.badge > 0 && (
                                            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[9px] font-extrabold leading-none text-white shadow-sm">
                                                {item.badge > 99 ? "99+" : item.badge}
                                            </span>
                                        )}
                                </span>
                                <span className={`max-w-full truncate px-1 text-[10px] leading-none transition-colors sm:text-[11px] md:text-xs lg:text-sm ${isActive ? "-mt-2 font-extrabold" : "font-semibold"}`}>
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}