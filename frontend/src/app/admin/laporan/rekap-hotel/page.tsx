"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, FileText } from "lucide-react";
import { API_URL, authFetch, parseJson } from "@/lib/auth";

export default function RekapHotelPage() {
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

    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        fetchHotels();
        handleFetchHotelRecap("", "", "");
    }, []);

    const fetchHotels = async () => {
        try {
            const res = await authFetch(`${API_URL}/api/hotels`);
            if (res.ok) {
                const data = await parseJson<any[]>(res);
                setHotelsList(data.filter((h) => h.verified === true));
            }
        } catch (e) {
            console.error("Gagal memuat daftar hotel", e);
        }
    };

    const handleFetchHotelRecap = async (
        hotel = selectedHotel,
        start = hotelStartDate,
        end = hotelEndDate
    ) => {
        try {
            setLoading(true);
            let url = `${API_URL}/api/rekap-hotel-penitipan?`;
            if (hotel) url += `hotel_name=${encodeURIComponent(hotel)}&`;
            if (start) url += `start_date=${start}&`;
            if (end) url += `end_date=${end}&`;

            const res = await authFetch(url);
            if (!res.ok) throw new Error("Gagal memuat rekap penitipan hotel");
            const data = await parseJson<any>(res);
            setHotelRecapData(data);
        } catch (err: any) {
            alert(err.message || "Gagal memuat data rekap penitipan hotel");
        } finally {
            setLoading(false);
        }
    };

    const handleExportPdf = async () => {
        try {
            setExporting(true);
            let url = `${API_URL}/api/export-hotel-penitipan?`;
            if (selectedHotel) url += `hotel_name=${encodeURIComponent(selectedHotel)}&`;
            if (hotelStartDate) url += `start_date=${hotelStartDate}&`;
            if (hotelEndDate) url += `end_date=${hotelEndDate}&`;

            const response = await authFetch(url, {
                headers: {
                    Accept: "application/pdf,application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Gagal mengekspor PDF rekap penitipan hotel.");
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            const safeHotel = selectedHotel ? selectedHotel.replace(/\s+/g, "_") : "Semua";
            a.download = `Rekap_Penitipan_Hotel_${safeHotel}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error: any) {
            alert(error.message || "Export PDF gagal.");
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-6 md:pb-24 font-sans text-black">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Link
                        href="/admin/laporan"
                        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors mb-2 cursor-pointer"
                    >
                        <ArrowLeft size={16} /> Kembali ke Laporan Distribusi
                    </Link>
                    <h1 className="text-3xl font-extrabold text-black flex items-center gap-3">
                        <Building2 className="text-amber-500" size={32} /> Rekapitulasi Penitipan Hotel
                    </h1>
                    <p className="text-black text-sm md:text-base mt-1">
                        Halaman khusus rekapitulasi penagihan dan penyaluran produk UMKM ke mitra perhotelan.
                    </p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-4">
                    Filter Rekapitulasi
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Pilih Hotel */}
                    <div>
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5">
                            Mitra Hotel
                        </label>
                        <select
                            value={selectedHotel}
                            onChange={(e) => {
                                const hotel = e.target.value;
                                setSelectedHotel(hotel);
                                void handleFetchHotelRecap(hotel, hotelStartDate, hotelEndDate);
                            }}
                            className="w-full h-11 px-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all cursor-pointer"
                        >
                            <option value="">-- Semua Hotel --</option>
                            {hotelsList.map((h) => (
                                <option key={h.id} value={h.name}>
                                    {h.name} ({h.city})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Tanggal Mulai */}
                    <div>
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5">
                            Tanggal Mulai
                        </label>
                        <input
                            type="date"
                            value={hotelStartDate}
                            onChange={(e) => setHotelStartDate(e.target.value)}
                            className="w-full h-11 px-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all cursor-pointer"
                        />
                    </div>

                    {/* Tanggal Selesai */}
                    <div>
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5">
                            Tanggal Selesai
                        </label>
                        <input
                            type="date"
                            value={hotelEndDate}
                            onChange={(e) => setHotelEndDate(e.target.value)}
                            className="w-full h-11 px-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all cursor-pointer"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-end gap-2">
                        <button
                            type="button"
                            onClick={handleExportPdf}
                            disabled={exporting}
                            className="flex-1 h-11 inline-flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs rounded-lg border border-amber-600 cursor-pointer disabled:opacity-50"
                        >
                            <FileText size={16} />
                            {exporting ? "Mengunduh..." : "Export PDF"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-extrabold text-blue-950">
                            Data Rekapitulasi Tagihan Hotel
                        </h2>
                        <p className="text-sm font-medium text-gray-500 mt-1">
                            {hotelRecapData?.hotel_name !== "Semua Hotel"
                                ? `Menampilkan rekap tagihan untuk ${hotelRecapData?.hotel_name}`
                                : "Menampilkan rekapitulasi seluruh hotel mitra"}
                        </p>
                    </div>
                    {hotelRecapData && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-800 rounded-xl text-xs font-bold border border-blue-100">
                            Periode: {hotelRecapData.period_start || "Semua"} s/d {hotelRecapData.period_end || "Semua"}
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="h-64 flex flex-col items-center justify-center text-blue-600 gap-3">
                        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        <p className="font-bold text-xs uppercase tracking-wider text-gray-500">Memuat Rekapitulasi Hotel...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto ring-1 ring-gray-100 rounded-2xl shadow-sm">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-gray-50/80 text-[10px] font-extrabold uppercase tracking-wider text-gray-500 border-b border-gray-100">
                                    <th className="py-5 px-6 text-center">No</th>
                                    <th className="py-5 px-6">Tanggal</th>
                                    <th className="py-5 px-6">Produk</th>
                                    <th className="py-5 px-6 text-center">Stok</th>
                                    <th className="py-5 px-6 text-right">Harga Jual</th>
                                    <th className="py-5 px-6 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm">
                                {hotelRecapData?.rows.map((row) => (
                                    <tr key={row.no} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="py-4 px-6 text-center font-bold text-gray-400">{row.no}</td>
                                        <td className="py-4 px-6 font-semibold text-gray-700">{row.tanggal}</td>
                                        <td className="py-4 px-6 font-extrabold text-blue-950">{row.produk}</td>
                                        <td className="py-4 px-6 text-center font-bold text-blue-600">{row.stok} unit</td>
                                        <td className="py-4 px-6 text-right font-semibold text-gray-700">Rp {Number(row.harga_jual).toLocaleString("id-ID")}</td>
                                        <td className="py-4 px-6 text-right font-extrabold text-blue-700">Rp {Number(row.total).toLocaleString("id-ID")}</td>
                                    </tr>
                                ))}
                                {(!hotelRecapData || hotelRecapData.rows.length === 0) && (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center text-gray-400 font-semibold">
                                            Belum ada rekaman penitipan hotel untuk periode ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {hotelRecapData && hotelRecapData.rows.length > 0 && (
                                <tfoot>
                                    <tr className="bg-emerald-50/70 border-t-2 border-emerald-100">
                                        <td colSpan={5} className="py-5 px-6 text-sm font-black uppercase tracking-wider text-emerald-900">
                                            TOTAL TAGIHAN
                                        </td>
                                        <td className="py-5 px-6 text-right text-lg font-black text-emerald-700">
                                            Rp {Number(hotelRecapData.total_tagihan || 0).toLocaleString("id-ID")}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
