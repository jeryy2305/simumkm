"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Download, TrendingUp, BarChart3, Package, Users, Building2, FileText, Eye } from "lucide-react";
import { API_URL, authFetch, parseJson } from "@/lib/auth";
import { Modal } from "@/components/Modal";

type MonthlyRow = {
    owner: string;
    tanggal: string;
    masuk: number;
    keluar: number;
    value: string;
    totalRawValue: number;
    items: any[];
};

type ProfitRow = {
    owner: string;
    product: string;
    units: number;
    profit: number;
    totalProfit: number;
};

const initialSummaryData = [
    { label: "Total Barang Masuk ke Mitra", value: "0", icon: Package, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Total Barang Keluar", value: "0", icon: TrendingUp, color: "text-green-600", bg: "bg-green-100" },
    { label: "Total Nilai Distribusi", value: "Rp 0", icon: BarChart3, color: "text-amber-500", bg: "bg-amber-100" },
    { label: "Jejaring UMKM Aktif", value: "0", icon: Users, color: "text-purple-600", bg: "bg-purple-100" },
];

const initialMonthlyData: MonthlyRow[] = [
    { owner: "-", tanggal: "-", masuk: 0, keluar: 0, value: "Rp 0", totalRawValue: 0, items: [] as any[] },
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

export default function Laporan() {
    const [allData, setAllData] = useState<any[]>([]);
    const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
    const [activeUmkms, setActiveUmkms] = useState<any[]>([]);
    const [summaryData, setSummaryData] = useState(initialSummaryData);
    const [monthlyData, setMonthlyData] = useState<MonthlyRow[]>(initialMonthlyData);
    const [profitData, setProfitData] = useState<ProfitRow[]>([]);
    const [showPeriodModal, setShowPeriodModal] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [filterOwner, setFilterOwner] = useState("");
    const [exportReportType, setExportReportType] = useState<"owner" | "profit">("owner");
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedDetailData, setSelectedDetailData] = useState<any>(null);

    // States for Rekap Penitipan Hotel
    const [hotelsList, setHotelsList] = useState<any[]>([]);
    const [selectedHotel, setSelectedHotel] = useState("");
    const [hotelStartDate, setHotelStartDate] = useState("");
    const [hotelEndDate, setHotelEndDate] = useState("");
    const [hotelRecapData, setHotelRecapData] = useState<{
        hotel_name: string;
        period_start: string | null;
        period_end: string | null;
        rows: {
            no: number;
            tanggal: string;
            produk: string;
            stok: number;
            harga_jual: number;
            total: number;
        }[];
        total_tagihan: number;
    } | null>(null);
    const [hotelRecapLoading, setHotelRecapLoading] = useState(false);
    const [hotelRecapExporting, setHotelRecapExporting] = useState(false);

    const handleFetchHotelRecap = async () => {
        try {
            setHotelRecapLoading(true);
            let url = `${API_URL}/api/rekap-hotel-penitipan?`;
            if (selectedHotel) url += `hotel_name=${encodeURIComponent(selectedHotel)}&`;
            if (hotelStartDate) url += `start_date=${hotelStartDate}&`;
            if (hotelEndDate) url += `end_date=${hotelEndDate}&`;

            const res = await authFetch(url);
            if (!res.ok) throw new Error("Gagal memuat rekap penitipan hotel");
            const data = await parseJson<any>(res);
            setHotelRecapData(data);
        } catch (err: any) {
            alert(err.message || "Gagal memuat data rekap penitipan hotel");
        } finally {
            setHotelRecapLoading(false);
        }
    };

    const handleExportHotelPdf = async () => {
        try {
            setHotelRecapExporting(true);
            let url = `${API_URL}/api/export-hotel-penitipan?`;
            if (selectedHotel) url += `hotel_name=${encodeURIComponent(selectedHotel)}&`;
            if (hotelStartDate) url += `start_date=${hotelStartDate}&`;
            if (hotelEndDate) url += `end_date=${hotelEndDate}&`;

            const response = await authFetch(url, {
                headers: {
                    "Accept": "application/pdf,application/json",
                }
            });

            if (!response.ok) {
                throw new Error("Gagal mengekspor PDF rekap penitipan hotel.");
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            const safeHotel = selectedHotel ? selectedHotel.replace(/\s+/g, '_') : 'Semua';
            a.download = `Rekap_Penitipan_Hotel_${safeHotel}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error: any) {
            alert(error.message || "Export PDF gagal.");
        } finally {
            setHotelRecapExporting(false);
        }
    };

    const processData = (consignments: any[], filterOwner: string, products = catalogProducts) => {
        const filtered = consignments.filter((item: any) => {
            if (item.umkm?.status !== "active") return false;
            if (filterOwner && item.umkm?.owner !== filterOwner) return false;
            if (!startDate && !endDate) return true;
            const itemDateString = item.distribution_date || item.start_date || item.created_at || "";
            const itemDate = new Date(itemDateString);
            if (isNaN(itemDate.getTime())) return false;
            const normalizedItemDate = new Date(itemDate.setHours(0, 0, 0, 0)).getTime();
            const start = startDate ? new Date(new Date(startDate).setHours(0, 0, 0, 0)).getTime() : null;
            const end = endDate ? new Date(new Date(endDate).setHours(0, 0, 0, 0)).getTime() : null;
            if (start !== null && normalizedItemDate < start) return false;
            if (end !== null && normalizedItemDate > end) return false;
            return true;
        });

        const profitMap = new Map<string, ProfitRow>();
        filtered
            .filter((item: any) => item.status !== "cancelled")
            .forEach((item: any) => {
                const owner = item.umkm?.owner || "Tidak Diketahui";
                const product = item.product?.name || "Produk Tidak Diketahui";
                const units = Number(item.quantity || item.product?.quantity || 0);
                const profit = Number(item.product?.partner_profit || 0);
                const key = `${owner}-${product}`;
                const current = profitMap.get(key) ?? { owner, product, units: 0, profit: 0, totalProfit: 0 };
                current.units += units;
                current.totalProfit += units * profit;
                current.profit = current.units > 0 ? current.totalProfit / current.units : 0;
                profitMap.set(key, current);
            });
        setProfitData(Array.from(profitMap.values()).sort((a, b) => a.owner.localeCompare(b.owner)));

        const consignedProductIds = new Set(consignments.filter((item: any) => item.status !== "cancelled").map((item: any) => item.product_id));
        const incomingProducts = products.filter((product: any) => {
            if (product.umkm?.status !== "active") return false;
            if (filterOwner && product.umkm?.owner !== filterOwner) return false;
            if (consignedProductIds.has(product.id)) return false;
            if (!startDate && !endDate) return true;
            const productDate = new Date(product.created_at || "");
            if (isNaN(productDate.getTime())) return false;
            const day = new Date(productDate.setHours(0, 0, 0, 0)).getTime();
            const start = startDate ? new Date(new Date(startDate).setHours(0, 0, 0, 0)).getTime() : null;
            const end = endDate ? new Date(new Date(endDate).setHours(0, 0, 0, 0)).getTime() : null;
            return (start === null || day >= start) && (end === null || day <= end);
        });
        const totalMasuk = incomingProducts.reduce((sum: number, product: any) => sum + Number(product.quantity || 0), 0);
        const completedConsignments = filtered.filter((item: any) => (item.distribution_status || item.status) === "received");
        const totalKeluar = completedConsignments.reduce((sum: number, item: any) => sum + Number(item.quantity || item.product?.quantity || 0), 0);
        const totalValue = completedConsignments.reduce((sum: number, item: any) => {
            const qty = Number(item.quantity || item.product?.quantity || 0);
            const price = Number(item.product?.price || 0);
            return sum + qty * price;
        }, 0);
        const activeUmkms = new Set(filtered.filter((item: any) => item.status !== "cancelled").map((item: any) => item.umkm?.name || item.umkm_id)).size;

        setSummaryData([
            { label: "Total Barang Masuk ke Mitra", value: totalMasuk.toString(), icon: Package, color: "text-blue-600", bg: "bg-blue-100" },
            { label: "Total Barang Keluar", value: totalKeluar.toString(), icon: TrendingUp, color: "text-green-600", bg: "bg-green-100" },
            { label: "Total Nilai Distribusi", value: formatCurrency(totalValue), icon: BarChart3, color: "text-amber-500", bg: "bg-amber-100" },
            { label: "Jejaring UMKM Aktif", value: activeUmkms.toString(), icon: Users, color: "text-purple-600", bg: "bg-purple-100" },
        ]);

        const dailyMap = new Map<string, { owner: string; dateKey: string; dateLabel: string; masuk: number; keluar: number; value: number; items: any[] }>();
        filtered.forEach((item: any) => {
            const dateValue = item.distribution_date || item.start_date || item.created_at || "";
            if (!dateValue) return;

            const dateObj = new Date(dateValue);
            if (isNaN(dateObj.getTime())) return;

            // Group by Day (YYYY-MM-DD)
            const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
            const dateLabel = formatDate(dateValue);
            const ownerName = item.umkm?.owner || "Tidak Diketahui";
            const compositeKey = `${ownerName}-${dateKey}`;
            
            const existing = dailyMap.get(compositeKey) ?? { owner: ownerName, dateKey: dateKey, dateLabel: dateLabel, masuk: 0, keluar: 0, value: 0, items: [] as any[] };
            const currentQty = Number(item.quantity || item.product?.quantity || 0);
            const currentPrice = Number(item.product?.price || 0);

            const distributionStatus = item.distribution_status || item.status;
            if (distributionStatus === "waiting" || distributionStatus === "distributed" || distributionStatus === "active") {
                existing.masuk += currentQty;
            }
            if (distributionStatus === "received" || distributionStatus === "completed") {
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

            let url = `${API_URL}/api/export?type=pdf&report_type=${exportReportType}`;
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
            const [consignmentsResponse, umkmsResponse, productsResponse, hotelsResponse] = await Promise.all([
                authFetch(`${API_URL}/api/consignments`),
                authFetch(`${API_URL}/api/umkms`),
                authFetch(`${API_URL}/api/products`),
                authFetch(`${API_URL}/api/hotels`)
            ]);
            const consignments = await parseJson<any[]>(consignmentsResponse);
            const umkms = await parseJson<any[]>(umkmsResponse);
            const products = await parseJson<any[]>(productsResponse);
            const hotels = await parseJson<any[]>(hotelsResponse);
            setAllData(consignments);
            setCatalogProducts(products);
            setActiveUmkms(umkms.filter(u => u.status === 'active'));
            setHotelsList(hotels.filter(h => h.verified === true));
            processData(consignments, filterOwner, products);
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
            processData(allData, filterOwner, catalogProducts);
        }
    }, [filterOwner, catalogProducts]);

    return (
        <div className="space-y-6 md:pb-24 font-sans text-black">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
                <div>
                    <h1 className="text-3xl font-extrabold text-black mb-2">Laporan Distribusi</h1>
                    <p className="text-black text-sm md:text-base">Ringkasan statistik penyaluran produk, mitra aktif, dan performa komersil waktu-nyata.</p>
                </div>
                <Link
                    href="/admin/laporan/rekap-hotel"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-black font-extrabold rounded-lg border border-amber-600 text-sm whitespace-nowrap cursor-pointer"
                >
                    <Building2 size={20} /> Rekapitulasi Hotel →
                </Link>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {summaryData.map((item, index) => {
                    const Icon = item.icon;
                    return (
                        <div key={index} className="bg-white rounded-lg p-5 border border-gray-200 flex items-center justify-between group">
                            <div>
                                <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-gray-500 mb-2">{item.label}</p>
                                <p className="text-2xl font-extrabold text-black">{item.value}</p>
                            </div>
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors shadow-inner ${item.bg} ${item.color}`}>
                                <Icon size={24} />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-5 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-sm font-extrabold text-blue-950">Opsi Laporan</p>
                    <p className="mt-1 text-xs font-medium text-gray-500">Atur periode dan pilih tabel yang ingin diekspor.</p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 md:min-w-155">
                <button
                    onClick={() => setShowPeriodModal(true)}
                    className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-blue-950 transition-all hover:bg-gray-50"
                >
                    <Calendar size={18} className="text-blue-500" /> Filter Periode
                </button>
                <select
                    className="h-12 w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-blue-950 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                    value={filterOwner}
                    onChange={(event) => setFilterOwner(event.target.value)}
                    aria-label="Filter berdasarkan pemilik UMKM"
                >
                    <option value="">Semua Pemilik UMKM</option>
                    {Array.from(new Set(activeUmkms.map((umkm) => umkm.owner))).map((owner) => (
                        <option key={owner} value={owner}>{owner}</option>
                    ))}
                </select>
                <select
                    value={exportReportType}
                    onChange={(event) => setExportReportType(event.target.value as "owner" | "profit")}
                    className="h-12 w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-blue-950 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                    aria-label="Pilih tabel laporan yang diekspor"
                >
                    <option value="owner">Rekapitulasi per Pemilik</option>
                    <option value="profit">Keuntungan Mitra</option>
                </select>
                <button
                    onClick={handleExport}
                    className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-600 bg-blue-600 px-4 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-700"
                >
                    <Download size={18} /> Export PDF
                </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                <div className="bg-white rounded-lg p-6 border border-gray-200 flex flex-col">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div>
                            <h2 className="text-xl font-extrabold text-blue-950 mb-2">Rekapitulasi per Pemilik</h2>
                            <p className="text-sm font-medium text-gray-500">Akumulasi jumlah distribusi per pemilik UMKM dan siklus waktu kalender.</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-x-auto ring-1 ring-gray-100 rounded-2xl shadow-sm">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Tanggal</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Pemilik UMKM</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Nama Produk</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100 text-center">Stok</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100 text-center">Harga / Unit</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100 text-right">Total Harga</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {monthlyData.map((data: any, index) => {
                                    const items = Array.isArray(data.items) && data.items.length > 0 ? data.items : [];
                                    if (items.length === 0) {
                                        return (
                                            <tr key={index} className="hover:bg-blue-50/30 transition-colors">
                                                <td className="py-5 px-6 text-sm font-bold text-gray-800">{data.tanggal || data.month}</td>
                                                <td className="py-5 px-6 text-sm font-bold text-blue-900">{data.owner}</td>
                                                <td colSpan={3} className="py-5 px-6 text-sm font-extrabold text-gray-800 text-center">-</td>
                                                <td className="py-5 px-6 text-sm font-extrabold text-blue-700 text-right">{formatCurrency(Number(data.totalRawValue || 0))}</td>
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
                                        );
                                    }

                                    return items.map((it: any, j: number) => {
                                        const qty = Number(it.product?.quantity || 0);
                                        const price = Number(it.product?.price || 0);
                                        const total = qty * price;
                                        return (
                                            <tr key={`${index}-${j}`} className="hover:bg-blue-50/30 transition-colors">
                                                {j === 0 && (
                                                    <td rowSpan={items.length} className="py-5 px-6 text-sm font-bold text-gray-800 align-top">{data.tanggal || data.month}</td>
                                                )}
                                                {j === 0 && (
                                                    <td rowSpan={items.length} className="py-5 px-6 text-sm font-bold text-blue-900 align-top">{data.owner}</td>
                                                )}
                                                <td className="py-5 px-6 text-sm font-extrabold text-gray-800">{it.product?.name || 'Produk Unknown'}</td>
                                                <td className="py-5 px-6 text-sm font-extrabold text-blue-600 text-center">{qty}</td>
                                                <td className="py-5 px-6 text-sm font-extrabold text-blue-900 text-center">{formatCurrency(price)}</td>
                                                <td className="py-5 px-6 text-sm font-extrabold text-blue-700 text-right">{it.status === 'completed' ? formatCurrency(total) : <span className="text-xs font-semibold uppercase tracking-[0.15em] text-orange-600">{it.status === 'active' ? 'Belum Keluar' : it.status}</span>}</td>
                                                {j === 0 && (
                                                    <td rowSpan={items.length} className="py-5 px-6 text-right align-top">
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
                                                )}
                                            </tr>
                                        );
                                    });
                                })}
                                {monthlyData.length === 0 || (monthlyData[0].owner === "-" && (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-gray-400 italic">Belum ada data rekapitulasi tersedia.</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-50">
                                    <td colSpan={5} className="py-4 px-6 text-sm font-extrabold text-gray-700">Total Akumulasi Nilai</td>
                                    <td className="py-4 px-6 text-sm font-extrabold text-blue-900 text-right">{formatCurrency(monthlyData.reduce((s: number, d: any) => s + Number(d.totalRawValue || 0), 0))}</td>
                                    <td className="py-4 px-6" />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="mb-6">
                        <h2 className="text-xl font-extrabold text-blue-950 mb-2">Rekapitulasi Keuntungan Mitra</h2>
                        <p className="text-sm font-medium text-gray-500">Perhitungan keuntungan berdasarkan jumlah produk yang tercatat dalam penitipan.</p>
                    </div>
                    <div className="overflow-x-auto rounded-2xl ring-1 ring-gray-100 shadow-sm">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-gray-50/70">
                                    <th className="py-4 px-6 text-[10px] font-extrabold uppercase tracking-[0.15em] text-gray-500 border-b border-gray-100">Pemilik UMKM</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold uppercase tracking-[0.15em] text-gray-500 border-b border-gray-100">Produk</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold uppercase tracking-[0.15em] text-gray-500 border-b border-gray-100 text-center">Total Unit</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold uppercase tracking-[0.15em] text-gray-500 border-b border-gray-100 text-right">Keuntungan / Unit</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold uppercase tracking-[0.15em] text-gray-500 border-b border-gray-100 text-right">Total Keuntungan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {profitData.map((row) => (
                                    <tr key={`${row.owner}-${row.product}`} className="transition-colors hover:bg-emerald-50/30">
                                        <td className="py-4 px-6 text-sm font-extrabold text-blue-950">{row.owner}</td>
                                        <td className="py-4 px-6 text-sm font-semibold text-gray-800">{row.product}</td>
                                        <td className="py-4 px-6 text-center text-sm font-bold text-gray-700">{row.units} unit</td>
                                        <td className="py-4 px-6 text-right text-sm font-semibold text-emerald-700">{formatCurrency(row.profit)}</td>
                                        <td className="py-4 px-6 text-right text-sm font-extrabold text-emerald-700">{formatCurrency(row.totalProfit)}</td>
                                    </tr>
                                ))}
                                {profitData.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-10 text-center text-sm italic text-gray-400">Belum ada data keuntungan mitra.</td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot>
                                <tr className="bg-emerald-50/60">
                                    <td colSpan={4} className="py-4 px-6 text-sm font-extrabold text-gray-700">Total Keuntungan Mitra</td>
                                    <td className="py-4 px-6 text-right text-sm font-extrabold text-emerald-700">{formatCurrency(profitData.reduce((sum, row) => sum + row.totalProfit, 0))}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>



            {/* Set Period Modal */}
            {showPeriodModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/40 backdrop-blur-sm px-4 py-6"
                    onClick={() => setShowPeriodModal(false)}
                >
                    <div
                        className="w-full max-w-lg rounded-4xl bg-white p-8 shadow-2xl ring-1 ring-black/5 transform transition-all"
                        onClick={(event) => event.stopPropagation()}
                    >
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
                                            <span className={`inline-flex rounded-lg border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
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
