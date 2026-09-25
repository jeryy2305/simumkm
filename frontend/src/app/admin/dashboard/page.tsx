"use client";

import { Users, Package, ClipboardList, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { API_URL, authFetch, parseJson } from "@/lib/auth";
import { Stat, Activity, AdminDashboardStats } from "@/lib/types";

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stat[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await authFetch(`${API_URL}/api/admin/dashboard/stats`);
                if (!response.ok) {
                    const body = await response.text();
                    throw new Error(body || "Gagal memuat stats");
                }
                const data = await parseJson<AdminDashboardStats>(response);
                setStats([
                    { title: "Total Mitra UMKM", value: data.total_umkm.toString(), icon: Users },
                    { title: "Total Produk", value: data.total_products.toString(), icon: Package },
                    { title: "Titipan Hari Ini", value: data.barang_masuk_hari_ini.toString(), icon: ClipboardList },
                    { title: "Nilai Distribusi", value: `Rp ${data.total_nilai_distribusi.toLocaleString()}`, icon: TrendingUp },
                ]);
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        };

        const fetchActivities = async () => {
            try {
                const response = await authFetch(`${API_URL}/api/admin/dashboard/activities`);
                if (!response.ok) {
                    const body = await response.text();
                    throw new Error(body || "Gagal memuat activities");
                }
                const data = await parseJson<Activity[]>(response);
                setActivities(data);
            } catch (error) {
                console.error('Error fetching activities:', error);
            }
        };

        fetchStats();
        fetchActivities();
    }, []);

    const statusBadge = (status: string) => {
        if (status === "Masuk") return "bg-blue-100 text-blue-700 border-blue-200";
        if (status === "Keluar") return "bg-green-100 text-green-700 border-green-200";
        return "bg-red-100 text-red-700 border-red-200";
    };

    return (
        <div className="space-y-6 pb-24 font-sans text-black">
            {/* Header Widget */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 md:p-8 mb-8">
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-black mb-2">Pusat Kendali Operasional</h1>
                        <p className="text-sm md:text-base text-black max-w-2xl leading-relaxed">
                            Ringkasan komprehensif performa jaringan mitra UMKM, pergerakan barang, dan siklus logistik hari ini.
                        </p>
                    </div>
                    <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 w-full lg:w-auto">
                        <p className="text-sm font-medium text-black mr-4 whitespace-nowrap">Status Sistem</p>
                        <div className="px-4 py-1.5 bg-green-50 text-green-700 rounded-lg font-bold text-xs uppercase tracking-widest border border-green-200 flex items-center whitespace-nowrap">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            Optimal
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="group rounded-lg bg-white p-5 border border-gray-200 cursor-pointer flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-gray-500 mb-2">{stat.title}</p>
                                <p className="text-2xl lg:text-3xl font-extrabold text-black">{stat.value}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-black shrink-0">
                                <Icon size={24} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Recent Activity Table Container */}
            <div className="bg-white rounded-lg border border-gray-200 p-2 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 pb-5 border-b border-gray-50">
                    <div>
                        <h2 className="text-xl font-extrabold text-blue-950">Aktivitas Titipan Terbaru</h2>
                        <p className="text-sm text-gray-500 mt-1">Lacak pencatatan masuk, keluar, atau pembatalan barang secara real-time.</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100">Tanggal</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100">Instansi / Hotel</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100">Item Produk</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100">Jumlah</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100">Tipe / Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {activities.length > 0 ? activities.map((activity, index) => (
                                <tr key={index} className="hover:bg-blue-50/30 transition-colors group cursor-default">
                                    <td className="py-4 px-6 text-sm font-medium text-gray-600">{activity.date}</td>
                                    <td className="py-4 px-6 text-sm font-extrabold text-gray-900 group-hover:text-blue-900 transition-colors">{activity.partner}</td>
                                    <td className="py-4 px-6 text-sm font-medium text-gray-600">{activity.product}</td>
                                    <td className="py-4 px-6 text-sm font-bold text-blue-950">{activity.qty} <span className="text-xs text-gray-400 font-medium">pcs</span></td>
                                    <td className="py-4 px-6">
                                        <div className="flex flex-col items-start gap-1">
                                            <span className={`inline-flex px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${statusBadge(activity.status)}`}>
                                                {activity.status}
                                            </span>
                                            <span className="text-xs text-gray-400 font-medium">{activity.type}</span>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <ClipboardList size={32} className="text-gray-300 mb-3" />
                                            <p className="font-semibold text-gray-600">Belum ada pergerakan</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
