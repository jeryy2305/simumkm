"use client";

import { Users, Package, ClipboardList, TrendingUp, ArrowUpRight, Activity as ActivityIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { API_URL, authFetch, parseJson } from "@/lib/auth";

interface Stat {
    title: string;
    value: string;
    icon: any;
}

interface Activity {
    date: string;
    type: string;
    partner: string;
    product: string;
    qty: number;
    status: string;
}

interface AdminDashboardStats {
    total_umkm: number;
    total_products: number;
    barang_masuk_hari_ini: number;
    total_nilai_distribusi: number;
}

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
        if (status === "Keluar") return "bg-amber-100 text-amber-700 border-amber-200";
        return "bg-red-100 text-red-700 border-red-200";
    };

    return (
        <div className="space-y-8 pb-20 font-sans text-gray-800">
            {/* Header Widget */}
            <div className="bg-linear-to-r from-blue-950 via-blue-900 to-blue-800 rounded-4xl p-8 md:p-10 text-white shadow-2xl relative overflow-hidden group mb-8">
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-linear-to-br from-amber-400 to-amber-600 rounded-full blur-[80px] opacity-30 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none"></div>
                <div className="absolute left-10 -bottom-20 w-60 h-60 bg-blue-600 rounded-full blur-[60px] opacity-40 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm border border-white/10 mb-4">
                            <ActivityIcon size={14} className="text-amber-400" />
                            <span className="text-xs font-bold text-blue-100 tracking-wider uppercase">Live Activity</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Pusat Kendali Operasional</h1>
                        <p className="text-base text-blue-100/90 max-w-2xl leading-relaxed">
                            Ringkasan komprehensif performa jaringan mitra UMKM, pergerakan barang, dan siklus logistik hari ini.
                        </p>
                    </div>
                    <div className="flex items-center bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 px-6 py-4 w-full lg:w-auto">
                        <p className="text-sm font-medium text-blue-200 mr-4 whitespace-nowrap">Status Sistem</p>
                        <div className="px-4 py-1.5 bg-green-500/20 text-green-300 rounded-full font-bold text-xs uppercase tracking-widest border border-green-500/50 flex items-center whitespace-nowrap">
                            <span className="w-2 h-2 bg-green-400 rounded-full mr-2 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse"></span>
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
                        <div key={index} className="group rounded-3xl bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 cursor-pointer flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-gray-500 mb-2">{stat.title}</p>
                                <p className="text-2xl lg:text-3xl font-extrabold text-blue-950">{stat.value}</p>
                            </div>
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-300 bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white shrink-0">
                                <Icon size={24} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Recent Activity Table Container */}
            <div className="bg-white rounded-4xl border border-gray-100 shadow-sm p-2 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 pb-5 border-b border-gray-50">
                    <div>
                        <h2 className="text-xl font-extrabold text-blue-950">Aktivitas Titipan Terbaru</h2>
                        <p className="text-sm text-gray-500 mt-1">Lacak pencatatan masuk, keluar, atau pembatalan barang secara real-time.</p>
                    </div>
                    <button className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-800 transition-all hover:gap-2 active:scale-95 cursor-pointer">
                        Lihat Semua <ArrowUpRight size={16} />
                    </button>
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
