"use client";

import { useState } from "react";
import { Sidebar } from "../components/Navigation";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="flex h-screen bg-linear-to-br from-slate-50 via-blue-50 to-white">
            <Sidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
                isCollapsed={sidebarCollapsed}
                setIsCollapsed={setSidebarCollapsed}
            />

            <div className="flex flex-col flex-1 overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    <div className="mx-auto w-full max-w-screen-2xl px-4 pb-8 pt-20 sm:px-6 sm:pt-20 lg:px-8 lg:py-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}