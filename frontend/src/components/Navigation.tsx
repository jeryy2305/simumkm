"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth";
import {
    LayoutDashboard,
    Users,
    Package,
    ClipboardList,
    FileText,
    LogOut,
    Menu,
    X,
    Building2
} from "lucide-react";

export function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) {
    const pathname = usePathname();

    const menuItems = [
        { name: "Dashboard Utama", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Manajemen UMKM", href: "/admin/umkm", icon: Users },
        { name: "Request Produk", href: "/admin/request-produk", icon: ClipboardList },
        { name: "Katalog Produk", href: "/admin/produk", icon: Package },
        { name: "Data Penitipan", href: "/admin/penitipan", icon: ClipboardList },
        { name: "Laporan Aktivitas", href: "/admin/laporan", icon: FileText },
    ];

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-blue-950/40 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-blue-950 text-white transition-all duration-300 transform ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"} lg:translate-x-0 lg:static lg:inset-0 border-r border-blue-900 flex flex-col`}>
                <div className="flex items-center justify-between h-24 px-6 bg-blue-900/40 border-b border-blue-800/80 backdrop-blur-md">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-blue-950 shadow-inner">
                            <Building2 size={24} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-extrabold tracking-wider text-white uppercase">SIM-KEMITRAAN</span>
                            <span className="text-[10px] font-bold text-amber-400 tracking-widest mt-1">PT ADE MESTAKUNG</span>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="lg:hidden text-blue-300 hover:text-white hover:bg-blue-800/50 transition-all p-2 rounded-xl active:scale-95 cursor-pointer">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex flex-col flex-1 overflow-y-auto px-5 py-8">
                    <p className="px-3 text-xs font-bold tracking-[0.2em] text-blue-400/80 mb-5 uppercase">Menu Operasional</p>
                    <nav className="flex-1 space-y-2.5">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            let isActive = false;

                            // Check if current path starts with item href, so nested pages are still highlighted
                            if (item.href === '/admin/dashboard') {
                                isActive = pathname === item.href;
                            } else {
                                isActive = pathname.startsWith(item.href);
                            }

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 group ${isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold" : "text-blue-200/90 hover:bg-blue-900/60 hover:text-white font-medium"}`}
                                >
                                    <Icon size={20} className={`mr-4 transition-colors ${isActive ? "text-amber-300" : "text-blue-400 group-hover:text-amber-400"}`} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-5 border-t border-blue-900/80 bg-blue-950">
                    <button
                        onClick={async () => {
                            await logout();
                            window.location.href = "/login";
                        }}
                        className="flex items-center px-4 py-4 text-blue-300 transition-all duration-300 rounded-2xl hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/20 w-full text-left font-bold group cursor-pointer active:scale-95"
                    >
                        <LogOut size={20} className="mr-4 text-blue-500 group-hover:text-white transition-colors" />
                        Keluar Sistem
                    </button>
                </div>
            </aside>
        </>
    );
}

export function Navbar({ setIsOpen }: { setIsOpen: (val: boolean) => void }) {
    const [scrolled, setScrolled] = useState(false);

    // This checks whether the window has scrolled down
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 15);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header
            className={`flex items-center justify-between px-6 transition-all duration-300 lg:justify-end sticky top-0 z-20 ${scrolled
                ? "py-3 bg-white/60 backdrop-blur-xl border-b border-gray-200/50 shadow-md"
                : "py-5 bg-white border-b border-gray-100 shadow-none"
                }`}
        >
            <button onClick={() => setIsOpen(true)} className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all focus:outline-none lg:hidden p-2 rounded-xl bg-gray-50 active:scale-95 cursor-pointer shadow-sm">
                <Menu size={24} />
            </button>

            <div className="flex items-center">
                <div className="flex items-center bg-gray-50/80 border border-gray-100 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer group">
                    <div className="mr-3 text-right hidden sm:block">
                        <p className="text-sm font-extrabold text-gray-800 leading-tight">Admin Pusat</p>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-blue-600 font-bold">Administrator</p>
                    </div>
                    <img
                        className={`w-10 h-10 rounded-full border-2 border-white transition-all duration-300 group-hover:scale-105 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}
                        src="https://ui-avatars.com/api/?name=Admin+Pusat&background=1e3a8a&color=fcd34d&bold=true"
                        alt="Admin Avatar"
                    />
                </div>
            </div>
        </header>
    );
}
