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
    Building2,
    Hotel,
    PanelLeftClose,
    PanelLeftOpen,
} from "lucide-react";

export function Sidebar({
    isOpen,
    setIsOpen,
    isCollapsed,
    setIsCollapsed,
}: {
    isOpen: boolean;
    setIsOpen: (val: boolean) => void;
    isCollapsed: boolean;
    setIsCollapsed: (val: boolean) => void;
}) {
    const pathname = usePathname();

    const menuItems = [
        { name: "Dashboard Utama", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Manajemen UMKM", href: "/admin/umkm", icon: Users },
        { name: "Data Hotel", href: "/admin/hotel", icon: Hotel },
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

            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-blue-950 text-white transition-[width,transform] duration-500 ease-in-out transform ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"} lg:translate-x-0 lg:static lg:inset-0 ${isCollapsed ? "lg:w-24" : "lg:w-72"} border-r border-blue-900 flex flex-col`}>
                <div className={`flex items-center h-24 bg-blue-900/40 border-b border-blue-800/80 backdrop-blur-md transition-[padding] duration-500 ease-in-out ${isCollapsed ? "justify-center px-3" : "justify-between px-6"}`}>
                    <div className={`flex items-center ${isCollapsed ? "justify-center" : "space-x-4"}`}>
                        <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-blue-950 shadow-inner">
                            <Building2 size={24} />
                        </div>
                        <div className={`flex flex-col overflow-hidden transition-[max-width,opacity] duration-500 ease-in-out ${isCollapsed ? "max-w-0 opacity-0" : "max-w-[180px] opacity-100"}`}>
                            <span className="text-sm font-extrabold tracking-wider text-white uppercase">SIM-KEMITRAAN</span>
                            <span className="text-[10px] font-bold text-amber-400 tracking-widest mt-1">PT ADE MESTAKUNG</span>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="lg:hidden text-blue-300 hover:text-white hover:bg-blue-800/50 transition-all p-2 rounded-xl active:scale-95 cursor-pointer">
                        <X size={24} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="hidden lg:flex p-2 rounded-xl text-blue-300 hover:bg-blue-800/60 hover:text-white transition-all cursor-pointer"
                        title={isCollapsed ? "Perlebar sidebar" : "Perkecil sidebar"}
                        aria-label={isCollapsed ? "Perlebar sidebar" : "Perkecil sidebar"}
                    >
                        {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                    </button>
                </div>

                <div className={`flex flex-col flex-1 overflow-y-auto py-8 transition-[padding] duration-500 ease-in-out ${isCollapsed ? "px-3" : "px-5"}`}>
                    <p className={`overflow-hidden px-3 text-xs font-bold tracking-[0.2em] text-blue-400/80 uppercase transition-[max-height,opacity,margin] duration-500 ease-in-out ${isCollapsed ? "max-h-0 opacity-0 mb-0" : "max-h-5 opacity-100 mb-5"}`}>Menu Operasional</p>
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
                                    className={`flex items-center rounded-2xl transition-[padding,background-color,box-shadow] duration-500 ease-in-out group ${isCollapsed ? "justify-center px-3 py-3.5" : "px-4 py-3.5"} ${isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold" : "text-blue-200/90 hover:bg-blue-900/60 hover:text-white font-medium"}`}
                                    title={isCollapsed ? item.name : undefined}
                                >
                                    <Icon size={20} className={`${isCollapsed ? "mr-0" : "mr-4"} transition-[margin,color] duration-500 ease-in-out ${isActive ? "text-amber-300" : "text-blue-400 group-hover:text-amber-400"}`} />
                                    <span className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-500 ease-in-out ${isCollapsed ? "max-w-0 opacity-0" : "max-w-[180px] opacity-100"}`}>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className={`border-t border-blue-900/80 bg-blue-950 transition-[padding] duration-500 ease-in-out ${isCollapsed ? "p-3" : "p-5"}`}>
                    <button
                        onClick={async () => {
                            await logout();
                            window.location.href = "/login";
                        }}
                        className={`flex items-center py-4 text-blue-300 transition-all duration-300 rounded-2xl hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/20 w-full font-bold group cursor-pointer active:scale-95 ${isCollapsed ? "justify-center px-3" : "px-4 text-left"}`}
                        title={isCollapsed ? "Keluar Sistem" : undefined}
                    >
                        <LogOut size={20} className={`${isCollapsed ? "mr-0" : "mr-4"} text-blue-500 group-hover:text-white transition-[margin,color] duration-500 ease-in-out`} />
                        <span className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-500 ease-in-out ${isCollapsed ? "max-w-0 opacity-0" : "max-w-[180px] opacity-100"}`}>Keluar Sistem</span>
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
                    <div
                        className={`w-10 h-10 rounded-full border-2 border-white bg-blue-900 text-amber-300 flex items-center justify-center text-xs font-extrabold transition-all duration-300 group-hover:scale-105 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}
                        aria-label="Admin Pusat"
                    >
                        AP
                    </div>
                </div>
            </div>
        </header>
    );
}
