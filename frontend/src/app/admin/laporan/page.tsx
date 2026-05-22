"use client";

import { useEffect, useState } from "react";
import { Calendar, Download, TrendingUp, BarChart3, Package, Users, PackageOpen } from "lucide-react";
import { API_URL, authFetch, parseJson } from "@/lib/auth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Modal } from "@/components/Modal";
import { Eye } from "lucide-react";

const initialSummaryData = [
    { label: "Barang Masuk", value: "0", icon: Package, color: "text-blue-500", bg: "bg-blue-100" },
    { label: "Barang Keluar", value: "0", icon: TrendingUp, color: "text-green-500", bg: "bg-green-100" },
    { label: "Nilai Distribusi", value: "Rp 0", icon: BarChart3, color: "text-amber-500", bg: "bg-amber-100" },
    { label: "UMKM Aktif", value: "0", icon: Users, color: "text-indigo-500", bg: "bg-indigo-100" },
];

const initialMonthlyData = [
    { owner: "-", tanggal: "-", masuk: 0, keluar: 0, value: "Rp 0" },
];

const initialReportData = [
    { date: "-", umkm: "-", product: "-", qty: 0, destination: "-", status: "-", value: "Rp 0", rawStatus: "-" },
];

function formatCurrency(value: number) {
    return `Rp ${Intl.NumberFormat("id-ID").format(value)}`;
}

function formatDate(dateString?: string) {
    if (!dateString) return "-";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "-";
        return date.toLocaleDateString("id-ID", { 
            day: "numeric", 
            month: "long", 
            year: "numeric" 
        });
    } catch (e) {
        return "-";
    }
}

function toMonthKey(dateString: string) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "0000-00";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function toMonthLabel(dateString: string) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

export default function Laporan() {
    const [allData, setAllData] = useState<any[]>([]);
    const [activeUmkms, setActiveUmkms] = useState<any[]>([]);
    const [summaryData, setSummaryData] = useState(initialSummaryData);
    const [monthlyData, setMonthlyData] = useState(initialMonthlyData);
    const [reportData, setReportData] = useState(initialReportData);
    const [chartData, setChartData] = useState<any[]>([]);
    const [showPeriodModal, setShowPeriodModal] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [filterOwner, setFilterOwner] = useState("");
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedDetailData, setSelectedDetailData] = useState<any>(null);

    const processData = (consignments: any[], filterOwner: string) => {
        const filtered = consignments.filter((item: any) => {
            if (item.umkm?.status !== "active") return false;
            if (filterOwner && item.umkm?.owner !== filterOwner) return false;
            if (!startDate && !endDate) return true;
            const itemDateString = item.created_at || item.start_date || "";
            const itemDate = new Date(itemDateString);
            if (isNaN(itemDate.getTime())) return false;
            const normalizedItemDate = new Date(itemDate.setHours(0, 0, 0, 0)).getTime();
            const start = startDate ? new Date(new Date(startDate).setHours(0, 0, 0, 0)).getTime() : null;
            const end = endDate ? new Date(new Date(endDate).setHours(0, 0, 0, 0)).getTime() : null;
            if (start !== null && normalizedItemDate < start) return false;
            if (end !== null && normalizedItemDate > end) return false;
            return true;
        });

        const activeConsignments = filtered.filter((item: any) => item.status === "active");
        const completedConsignments = filtered.filter((item: any) => item.status === "completed");
        const totalMasuk = activeConsignments.reduce((sum: number, item: any) => sum + Number(item.product?.quantity || 0), 0);
        const totalKeluar = completedConsignments.reduce((sum: number, item: any) => sum + Number(item.product?.quantity || 0), 0);
        const totalValue = completedConsignments.reduce((sum: number, item: any) => {
            const qty = Number(item.product?.quantity || 0);
            const price = Number(item.product?.price || 0);
            return sum + qty * price;
        }, 0);
        const activeUmkms = new Set(filtered.filter((item: any) => item.status !== "cancelled").map((item: any) => item.umkm?.name || item.umkm_id)).size;

        setSummaryData([
            { label: "Total Barang Masuk", value: totalMasuk.toString(), icon: Package, color: "text-blue-600", bg: "bg-blue-100" },
            { label: "Total Barang Keluar", value: totalKeluar.toString(), icon: TrendingUp, color: "text-green-600", bg: "bg-green-100" },
            { label: "Total Nilai Distribusi", value: formatCurrency(totalValue), icon: BarChart3, color: "text-amber-500", bg: "bg-amber-100" },
            { label: "Jejaring UMKM Aktif", value: activeUmkms.toString(), icon: Users, color: "text-purple-600", bg: "bg-purple-100" },
        ]);

        const dailyMap = new Map<string, { owner: string; dateKey: string; dateLabel: string; masuk: number; keluar: number; value: number; items: any[] }>();
        filtered.forEach((item: any) => {
            const dateValue = item.created_at || item.start_date || "";
            if (!dateValue) return;

            const dateObj = new Date(dateValue);
            if (isNaN(dateObj.getTime())) return;

            // Group by Day (YYYY-MM-DD)
            const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
            const dateLabel = formatDate(dateValue);
            const ownerName = item.umkm?.owner || "Tidak Diketahui";
            const compositeKey = `${ownerName}-${dateKey}`;
            
            const existing = dailyMap.get(compositeKey) ?? { owner: ownerName, dateKey: dateKey, dateLabel: dateLabel, masuk: 0, keluar: 0, value: 0, items: [] as any[] };
            const currentQty = Number(item.product?.quantity || 0);
            const currentPrice = Number(item.product?.price || 0);

            if (item.status === "active") {
                existing.masuk += currentQty;
            }
            if (item.status === "completed") {
                existing.keluar += currentQty;
                existing.value += currentQty * currentPrice;
            }
            
            existing.items.push(item);
            dailyMap.set(compositeKey, existing);
        });

        const dailyRows = Array.from(dailyMap.values())
            .sort((a, b) => {
                if (a.dateKey !== b.dateKey) {
                    return b.dateKey.localeCompare(a.dateKey);
                }
                return a.owner.localeCompare(b.owner);
            })
            .map((value) => ({
                owner: value.owner,
                tanggal: value.dateLabel,
                masuk: value.masuk,
                keluar: value.keluar,
                value: formatCurrency(value.value),
                items: value.items,
                totalRawValue: value.value
            }))
            .slice(0, 15);

        setMonthlyData(dailyRows.length > 0 ? dailyRows : initialMonthlyData);

        const sortedReport = filtered
            .slice()
            .sort((a: any, b: any) => new Date(b.created_at || b.start_date).getTime() - new Date(a.created_at || a.start_date).getTime())
            .slice(0, 8)
            .map((item: any) => ({
                date: formatDate(item.created_at || item.start_date),
                umkm: item.umkm?.name || item.umkm?.owner || "-",
                product: item.product?.name || "-",
                qty: Number(item.product?.quantity || 0),
                destination: item.company || item.location || "-",
                status: item.status === "active" ? "MASUK" : item.status === "completed" ? "KELUAR" : "DIBATALKAN",
                rawStatus: item.status,
                value: formatCurrency(Number(item.product?.quantity || 0) * Number(item.product?.price || 0)),
            }));

        setReportData(sortedReport.length > 0 ? sortedReport : initialReportData);

        // Prepare chart data - group by month
        const chartMap = new Map<string, { month: string; total: number; monthKey: string }>();
        filtered.forEach((item: any) => {
            const dateKey = toMonthKey(item.created_at || item.start_date || "");
            const monthLabel = toMonthLabel(item.created_at || item.start_date || "");
            
            if (!monthLabel || monthLabel === "-") return;

            const existing = chartMap.get(dateKey) ?? { month: monthLabel, total: 0, monthKey: dateKey };
            existing.total += Number(item.product?.quantity || 0) * Number(item.product?.price || 0);
            chartMap.set(dateKey, existing);
        });

        const chartRows = Array.from(chartMap.values())
            .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
            .map(({ month, total }) => ({
                month,
                total,
            }));

        setChartData(chartRows.length > 0 ? chartRows : []);
    };

    const applyFilter = () => {
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            alert("Tanggal mulai harus sebelum atau sama dengan tanggal akhir.");
            return;
        }
        processData(allData, filterOwner);
        setShowPeriodModal(false);
    };

    const handleExport = async () => {
        try {
            setIsRefreshing(true);

            let url = `${API_URL}/api/export?type=pdf`;
            if (startDate) url += `&start_date=${startDate}`;
            if (endDate) url += `&end_date=${endDate}`;
            if (filterOwner) url += `&filter_owner=${encodeURIComponent(filterOwner)}`;

            const acceptHeader = "application/pdf,application/json";

            console.log("Export URL:", url);

            const response = await authFetch(url, {
                headers: {
                    "Accept": acceptHeader,
                    "X-Requested-With": "XMLHttpRequest"
                }
            });

            console.log("Response Status:", response.status);
            console.log("Response Headers:", Array.from(response.headers.entries()));
            console.log("Response Content-Type:", response.headers.get("content-type"));

            if (!response.ok) {
                let errorMsg = `HTTP ${response.status}: Gagal mengekspor laporan.`;
                try {
                    const errorText = await response.text();
                    console.log("Error Response Body (first 500 chars):", errorText.substring(0, 500));
                    
                    try {
                        const errorJson = JSON.parse(errorText);
                        if (errorJson.message) {
                            errorMsg = errorJson.message;
                        } else if (errorText && !errorText.toLowerCase().includes("<!doctype html>")) {
                            errorMsg = errorText.substring(0, 100);
                        }
                    } catch (parseError) {
                        if (errorText.toLowerCase().includes("<!doctype html>") || errorText.toLowerCase().includes("<html")) {
                            errorMsg = `Server mengembalikan HTML (mungkin login redirect). Status: ${response.status}. Alamat API: ${url}`;
                        } else if (errorText) {
                            errorMsg = `Error: ${errorText.substring(0, 100)}`;
                        }
                    }
                } catch (e) {
                    console.error("Error reading response:", e);
                }
                throw new Error(errorMsg);
            }

            const blob = await response.blob();
            console.log("Blob Type:", blob.type);
            console.log("Blob Size:", blob.size);

            if (blob.type.includes("json")) {
                const text = await blob.text();
                let errorMsg = "Gagal mengunduh file (JSON response).";
                try {
                    const errorJson = JSON.parse(text);
                    if (errorJson.message) errorMsg = errorJson.message;
                } catch (e) {
                    errorMsg = `Unexpected JSON: ${text.substring(0, 100)}`;
                }
                throw new Error(errorMsg);
            }

            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = downloadUrl;
            a.download = `Laporan_Rekapitulasi_${new Date().getTime()}.pdf`;
            document.body.appendChild(a);
            a.click();
            
            // Berikan sedikit jeda sebelum membersihkan agar browser sempat memulai download
            setTimeout(() => {
                window.URL.revokeObjectURL(downloadUrl);
                if (document.body.contains(a)) {
                    document.body.removeChild(a);
                }
            }, 500);
            
            console.log("Export successful!");
            alert("Laporan berhasil dibuat dan proses pengunduhan sedang dimulai.");
        } catch (error: any) {
            console.error("Export Error:", error);
            alert(error.message);
        } finally {
            setIsRefreshing(false);
        }
    };

    const loadData = async () => {
        try {
            setIsRefreshing(true);
            const [consignmentsResponse, umkmsResponse] = await Promise.all([
                authFetch(`${API_URL}/api/consignments`),
                authFetch(`${API_URL}/api/umkms`)
            ]);
            const consignments = await parseJson<any[]>(consignmentsResponse);
            const umkms = await parseJson<any[]>(umkmsResponse);
            setAllData(consignments);
            setActiveUmkms(umkms.filter(u => u.status === 'active'));
            processData(consignments, filterOwner);
        } catch (error) {
            console.error("Error fetching laporan data:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
    loadData();
    }, []);

    useEffect(() => {
        if (allData.length > 0 && !isRefreshing) {
            processData(allData, filterOwner);
        }
    }, [filterOwner]);

    const statusBadge = (rawStatus: string, label: string) => {
        if (rawStatus === "active") return <span className="inline-flex px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-blue-200">↻ {label}</span>;
        if (rawStatus === "completed") return <span className="inline-flex px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-green-200">✓ {label}</span>;
        return <span className="inline-flex px-3 py-1 bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-red-200">✕ {label}</span>;
    };

    return (
        <div className="space-y-8 md:pb-24 font-sans text-gray-800">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
                <div>
                    <h1 className="text-3xl font-extrabold text-blue-950 mb-2">Laporan Distribusi</h1>
                    <p className="text-gray-500 text-sm md:text-base">Ringkasan statistik penyaluran produk, mitra aktif, dan performa komersil waktu-nyata.</p>
                </div>
                <div className="flex items-center space-x-3 self-start md:self-auto">
                    <button
                        onClick={() => setShowPeriodModal(true)}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-gray-50 text-blue-950 font-bold border border-gray-200 rounded-xl shadow-sm transition-all text-sm cursor-pointer"
                    >
                        <Calendar size={18} className="text-blue-500" /> Filter Periode
                    </button>
                    <button
                        onClick={handleExport}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold border border-blue-600 rounded-xl shadow-lg shadow-blue-600/30 transition-all text-sm cursor-pointer"
                    >
                        <Download size={18} /> Export PDF
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {summaryData.map((item, index) => {
                    const Icon = item.icon;
                    return (
                        <div key={index} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                            <div>
                                <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-gray-500 mb-2">{item.label}</p>
                                <p className="text-2xl font-extrabold text-blue-950">{item.value}</p>
                            </div>
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors shadow-inner ${item.bg} ${item.color}`}>
                                <Icon size={24} />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Chart */}
                <div className="bg-white rounded-4xl p-8 border border-gray-100 shadow-sm flex flex-col h-[450px]">
                    <h2 className="text-xl font-extrabold text-blue-950 mb-2">Grafik Performa Bulanan</h2>
                    <p className="text-sm font-medium text-gray-500 mb-6">Total nilai distribusi produk per bulan</p>

                    {chartData.length > 0 ? (
                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis 
                                        dataKey="month" 
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis 
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                        label={{ value: 'Nilai Distribusi (Rp)', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontWeight: 'bold' } }}
                                    />
                                    <Tooltip 
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '12px',
                                            padding: '12px',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                        }}
                                        formatter={(value) => [formatCurrency(value as number), 'Nilai Distribusi']}
                                        labelStyle={{ color: '#1e293b', fontWeight: 'bold', marginBottom: '4px' }}
                                    />
                                    <Bar dataKey="total" fill="#3b82f6" radius={[10, 10, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 relative">
                            <BarChart3 size={48} className="mb-4 text-gray-300" />
                            <p className="font-bold text-gray-600 tracking-wider">Tidak Ada Data</p>
                            <p className="text-xs text-gray-400 mt-2 max-w-50 text-center">Silahkan sesuaikan filter periode dan pemilik UMKM untuk melihat grafik.</p>
                        </div>
                    )}
                </div>

                {/* Monthly Record Table (Moved here and made full width) */}
                <div className="bg-white rounded-4xl p-8 border border-gray-100 shadow-sm flex flex-col">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div>
                            <h2 className="text-xl font-extrabold text-blue-950 mb-2">Rekapitulasi per Pemilik</h2>
                            <p className="text-sm font-medium text-gray-500">Akumulasi jumlah distribusi per pemilik UMKM dan siklus waktu kalender.</p>
                        </div>
                        <div className="shrink-0">
                            <select
                                className="w-full md:w-72 px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-50/80 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-600/20 transition-all cursor-pointer"
                                value={filterOwner}
                                onChange={(e) => setFilterOwner(e.target.value)}
                            >
                                <option value="">Filter: Semua Pemilik UMKM</option>
                                {Array.from(new Set(activeUmkms.map(u => u.owner))).map(owner => (
                                    <option key={owner} value={owner}>{owner}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 overflow-x-auto ring-1 ring-gray-100 rounded-2xl shadow-sm">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Tanggal</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Pemilik UMKM</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100 text-center">Unit Masuk</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100 text-center">Unit Terkirim</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {monthlyData.map((data: any, index) => (
                                    <tr key={index} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="py-5 px-6 text-sm font-bold text-gray-800">{data.tanggal || data.month}</td>
                                        <td className="py-5 px-6 text-sm font-bold text-blue-900">{data.owner}</td>
                                        <td className="py-5 px-6 text-sm font-extrabold text-blue-600 text-center">{data.masuk}</td>
                                        <td className="py-5 px-6 text-sm font-extrabold text-green-600 text-center">{data.keluar}</td>
                                        <td className="py-5 px-6 text-right">
                                            <button 
                                                onClick={() => {
                                                    setSelectedDetailData(data);
                                                    setIsDetailModalOpen(true);
                                                }}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold rounded-xl transition-all text-xs border border-blue-100 hover:border-blue-600 shadow-sm"
                                            >
                                                <Eye size={14} /> Detail
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {monthlyData.length === 0 || (monthlyData[0].owner === "-" && (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-gray-400 italic">Belum ada data rekapitulasi tersedia.</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>



            {/* Set Period Modal */}
            {showPeriodModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/40 backdrop-blur-sm px-4 py-6">
                    <div className="w-full max-w-lg rounded-4xl bg-white p-8 shadow-2xl ring-1 ring-black/5 transform transition-all">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-extrabold text-blue-950">Atur Rentang Laporan</h2>
                                <p className="text-sm font-medium text-gray-500 mt-1">Filter laporan berdasarkan periode tanggal spesifik.</p>
                            </div>
                            <button
                                type="button"
                                className="rounded-xl bg-gray-50 p-2.5 text-gray-500 hover:bg-gray-100 hover:text-red-500 transition-colors"
                                onClick={() => setShowPeriodModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2 mb-8">
                            <div>
                                <label className="block text-[11px] font-extrabold uppercase tracking-widest text-gray-500 mb-2">Mulai Dari</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(event) => setStartDate(event.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm font-semibold text-gray-800"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-extrabold uppercase tracking-widest text-gray-500 mb-2">Hingga Tanggal</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(event) => setEndDate(event.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm font-semibold text-gray-800"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
                            <button onClick={() => setShowPeriodModal(false)} className="px-6 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Tutup</button>
                            <button onClick={applyFilter} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-95">Terapkan Rentang</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {isDetailModalOpen && selectedDetailData && (
                <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Rincian Distribusi Produk">
                    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400 mb-1">Pemilik UMKM</p>
                                    <p className="text-lg font-extrabold text-blue-950">{selectedDetailData.owner}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400 mb-1">Tanggal Distribusi</p>
                                    <p className="text-lg font-extrabold text-blue-950">{selectedDetailData.tanggal}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-extrabold text-gray-800 mb-4 flex items-center gap-2">
                                <Package size={18} className="text-blue-500" />
                                Daftar Produk yang Dititipkan
                            </h3>
                            <div className="space-y-3">
                                {selectedDetailData.items.map((item: any, idx: number) => (
                                    <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:border-blue-200 transition-all">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="font-extrabold text-gray-900">{item.product?.name || 'Produk Unknown'}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Tujuan: {item.company}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                item.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                            }`}>
                                                {item.status === 'active' ? 'Masuk' : 'Selesai'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-50">
                                            <div>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Stok Katalog</p>
                                                <p className="text-sm font-extrabold text-blue-950">{item.product?.quantity || 0} unit</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Harga</p>
                                                <p className="text-sm font-extrabold text-blue-950">Rp {Number(item.product?.price || 0).toLocaleString('id-ID')}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Total Nilai</p>
                                                <p className="text-sm font-extrabold text-blue-700">Rp {(Number(item.product?.quantity || 0) * Number(item.product?.price || 0)).toLocaleString('id-ID')}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase">Total Akumulasi Nilai</p>
                                <p className="text-2xl font-black text-blue-900">{selectedDetailData.value}</p>
                            </div>
                            <button onClick={() => setIsDetailModalOpen(false)} className="px-6 py-3 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-all shadow-lg">
                                Tutup Rincian
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
