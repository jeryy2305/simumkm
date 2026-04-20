"use client";

import { useState } from "react";
import { Sidebar, Navbar } from "../components/Navigation";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-linear-to-br from-slate-50 via-blue-50 to-white">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <div className="flex flex-col flex-1 overflow-hidden">
                <Navbar setIsOpen={setSidebarOpen} />

                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    <div className="container px-6 py-8 mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}