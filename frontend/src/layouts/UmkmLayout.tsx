"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout, getAuthUser } from "@/lib/auth";
import {
    LayoutDashboard,
    Package,
    ClipboardList,
    LogOut,
    User,
    ShoppingBag
} from "lucide-react";
import type { AuthUser } from "@/lib/auth";

export default function UmkmLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);
    const [user, setUser] = useState<AuthUser | null>(null);

    const [open, setOpen] = useState(false);

    useEffect(() => {
        setUser(getAuthUser());
    }, []);

    useEffect(() => {
        const handleClickOutside = () => setOpen(false);
        if (open) document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [open]);

    const handleScroll = (e: React.UIEvent<HTMLElement>) => {
        setIsScrolled(e.currentTarget.scrollTop > 10);
    };

    const bottomNavItems = [
        { name: "Beranda", href: "/umkm/dashboard", icon: LayoutDashboard },
        { name: "Produk", href: "/umkm/produk", icon: Package },
        { name: "Titipan", href: "/umkm/penitipan", icon: ClipboardList },
    ];

    return (
        <div className="flex flex-col h-screen bg-gray-50 pb-16">
            {/* Top Header */}
            <header className={`fixed top-0 inset-x-0 z-40 h-14 flex items-center justify-between px-4 transition-all duration-300 ${
                isScrolled ? "bg-white/70 backdrop-blur-md shadow-sm" : "bg-white border-b border-transparent"
            }`}>
                <div className="flex items-center space-x-2">
                    <ShoppingBag className="text-secondary opacity-90" />
                    <span className="font-bold text-gray-800">SIM UMKM</span>
                </div>

                {/* USER + DROPDOWN */}
                <div className="relative flex items-center space-x-4">
                    {user && (
                        <>
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
                className="flex-1 overflow-y-auto pt-14 px-4 pb-4"
                onScroll={handleScroll}
            >
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 h-16 flex justify-around items-center">
                {bottomNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                                isActive ? "text-secondary" : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            <Icon size={20} className={isActive ? "fill-secondary/20" : ""} />
                            <span className="text-[10px] font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}