"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, ClipboardList, CheckCircle2, Bell, Zap, ShieldAlert, AlertCircle, Building2 } from "lucide-react";
import { API_URL, authFetch, parseJson } from "@/lib/auth";
import FloatingWhatsAppButton from "@/components/FloatingWhatsAppButton";
import { DashboardData } from "@/lib/types";

export default function DashboardUMKM() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await authFetch(`${API_URL}/api/umkm-user/dashboard`);
      if (!res.ok) {
        let errorMessage = "Gagal memuat data dashboard";
        try {
          const errorData = await parseJson<{ message?: string }>(res);
          errorMessage = errorData?.message || errorMessage;
        } catch (parseError) {
          errorMessage = `Error ${res.status}: ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const json = await parseJson<DashboardData>(res);
      setData(json);

    } catch (e) {
      const message = e instanceof Error ? e.message : "Terjadi kesalahan jaringan";
      console.error("Dashboard fetch error", message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
          <span className="font-semibold tracking-wide text-black">Memuat dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-xl mx-auto mt-10 text-center bg-white rounded-lg border border-red-200">
        <div className="w-16 h-16 bg-red-50 rounded-lg flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="text-red-500" size={32} />
        </div>
        <p className="font-bold text-xl text-gray-900 mb-2">Terjadi Kesalahan</p>
        <p className="text-gray-500 mb-6">{error}</p>
        <button onClick={fetchDashboard} className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium">
          Muat Ulang Dashboard
        </button>
      </div>
    );
  }

  if (!data) {
    return <div className="p-6 text-center text-gray-500">Data dashboard tidak tersedia.</div>;
  }

  const stats = [
    { label: "Total Titipan", value: data.stats.total_titipan, icon: ClipboardList, color: "text-amber-600 bg-amber-50 group-hover:bg-amber-600 group-hover:text-white" },
    { label: "Produk Aktif", value: data.stats.produk_aktif, icon: Package, color: "text-blue-600 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white" },
    { label: "Selesai", value: data.stats.selesai, icon: CheckCircle2, color: "text-green-600 bg-green-50 group-hover:bg-green-600 group-hover:text-white" },
  ];

  const statusStyle = (status: string) => {
    if (status === "Diterima Hotel" || status === "Selesai") return "bg-green-50 text-green-700 border-green-200";
    if (status === "Menunggu Distribusi" || status === "Didistribusikan" || status === "Proses" || status === "Menunggu") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-blue-50 text-blue-700 border-blue-200";
  };

  const activityIcon = (type: string) => {
    if (type === "dispute") return ShieldAlert;
    if (type === "consignment") return ClipboardList;
    return Zap;
  };

  if (data.umkm.status === "inactive") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center font-sans text-gray-800 px-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-10 md:p-12 flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-amber-50 rounded-lg flex items-center justify-center mb-6">
            <AlertCircle size={48} className="text-amber-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-blue-950 mb-4 tracking-tight">Akun Dalam Peninjauan</h2>
          <p className="text-gray-500 mb-10 leading-relaxed text-[15px]">
            Akun kemitraan UMKM Anda saat ini berstatus tidak aktif. Silakan hubungi tim manajemen kami untuk mengaktifkan kembali akun agar Anda bisa mengakses seluruh fitur dashboard.
          </p>
          <a
            href="https://wa.me/62819809141?text=Halo%20Admin%20PT.%20Ade%20Mestakung%20Abadi,%20saya%20ingin%20meminta%20bantuan%20aktivasi%20lagi%20akun%20UMKM%20saya"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-amber-500 hover:bg-amber-600 text-blue-950 font-extrabold rounded-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
            Hubungi Admin Sekarang
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 font-sans text-gray-800">
      <div className="space-y-8">
        {/* Header Widget */}
        <div className="bg-blue-950 rounded-lg p-8 md:p-10 text-white border border-blue-900 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-8">
              <div className="bg-blue-900 p-2.5 rounded-md border border-blue-800">
                <Building2 size={24} className="text-amber-400" />
              </div>
              <p className="text-xs md:text-sm font-bold tracking-[0.2em] text-blue-200 uppercase">PT. Ade Mestakung Abadi</p>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight mb-3">Halo, {data.umkm.owner}!</h1>
            <p className="text-base text-blue-100 max-w-2xl mb-8 leading-relaxed">
              Pantau ringkasan penitipan, penjualan, dan seluruh aktivitas kemitraan UMKM Anda secara real-time.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-5 px-6 bg-blue-900 rounded-md border border-blue-800">
              <div className="mb-4 sm:mb-0">
                <p className="text-sm font-medium text-blue-300 uppercase tracking-widest mb-1">Mitra Terdaftar</p>
                <p className="text-xl font-bold">{data.umkm.owner}</p>
              </div>
              <button onClick={fetchDashboard} className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-500 hover:bg-amber-400 px-6 py-3 text-sm font-bold text-blue-950 w-full sm:w-auto">
                Segarkan Data
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-lg bg-white p-6 border border-gray-200">
                <div className="flex items-center gap-5">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-colors duration-300 ${stat.color}`}>
                    <Icon size={28} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-3xl font-extrabold text-blue-950">{stat.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Activities Section */}
        <section className="bg-white rounded-lg border border-gray-200 p-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-6 pb-4">
            <div>
              <h2 className="text-2xl font-extrabold text-blue-950">Aktivitas Terakhir</h2>
              <p className="text-sm text-gray-500 mt-1">Riwayat penempatan titipan dan transaksi terbaru.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-5 py-2.5 text-sm font-bold text-blue-700">
              <Bell size={18} />
              <span>{data.recent_activities.length} aktivitas hari ini</span>
            </div>
          </div>

          <div className="overflow-hidden bg-white">
            {data.recent_activities.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
                  <ClipboardList size={32} className="text-gray-400" />
                </div>
                <p className="text-lg font-bold text-gray-700">Belum Ada Aktivitas</p>
                <p className="text-sm text-gray-500 mt-2 max-w-sm">Data riwayat penyaluran dan titipan produk Anda akan muncul di sini.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 px-2">
                {data.recent_activities.map((activity) => {
                  const Icon = activityIcon(activity.type);
                  return (
                    <div key={activity.id} className="flex flex-col gap-4 p-4 hover:bg-gray-50 rounded-md sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-5">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                          <Icon size={24} />
                        </div>
                        <div>
                          <p className="text-base font-bold text-gray-900 group-hover:text-blue-950 transition-colors">{activity.title}</p>
                          <p className="mt-1 text-sm text-gray-500 font-medium">{activity.date}</p>
                        </div>
                      </div>
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3">
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${statusStyle(activity.status)}`}>
                          {activity.status}
                        </span>
                        <p className="text-base font-bold text-blue-950">{activity.amount}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Floating WhatsApp Button */}
      <FloatingWhatsAppButton />
    </div>
  );
}