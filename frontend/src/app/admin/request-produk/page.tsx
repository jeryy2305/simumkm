"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Plus, Search, Package, Tag, Trash2 } from "lucide-react";
import { Modal } from "@/components/Modal";
import Toast from "@/components/Toast";
import { API_URL, authFetch, parseJson } from "@/lib/auth";

interface UmkmData {
    id: number;
    owner: string;
    name?: string;
    phone?: string;
    address?: string;
}

interface ProductRequest {
    id: number;
    name: string;
    category: string;
    quantity: number;
    reference_price: number | null;
    partner_profit?: number | null;
    hotel_departure_date?: string | null;
    delivered_to_partner_at?: string | null;
    history_status?: string;
    price_offered: number | null;
    purpose?: string | null;
    status: "open" | "pending_approval" | "taken" | "completed" | "cancelled" | "expired" | "fulfilled" | "unfulfilled";
    taken_by_umkm?: UmkmData | null;
    participation_deadline?: string | null;
    offers?: Array<{ id: number; price_offered: number; quantity_offered?: number | null; status: string; umkm?: UmkmData | null }>;
}

interface ProductRequestDetail extends ProductRequest {
    created_at?: string;
    takenByUmkm?: UmkmData | null;
}

interface Notification {
    type: "success" | "error" | "info";
    message: string;
}

interface RequestForm {
    name: string;
    category: string;
    quantity: number;
    reference_price: string;
    partner_profit: string;
    hotel_departure_date: string;
    purpose: string;
}

export default function RequestProdukAdmin() {
    const [requests, setRequests] = useState<ProductRequest[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState<Notification | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [deletingRequestId, setDeletingRequestId] = useState<number | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<ProductRequestDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [rejectingRequestId, setRejectingRequestId] = useState<number | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<RequestForm>({
        name: "",
        category: "Makanan",
        quantity: 1,
        reference_price: "",
        partner_profit: "",
        hotel_departure_date: "",
        purpose: "Mencari UMKM Penyedia Stok Produk",
    });

    const purposeOptions = [
        { value: "Mencari UMKM Penyedia Stok Produk", label: "Mencari UMKM Penyedia Stok Produk" },
    ];

    useEffect(() => {
        fetchRequests();
    }, []);

    useEffect(() => {
        if (!notification) return;
        const timer = window.setTimeout(() => setNotification(null), 4000);
        return () => window.clearTimeout(timer);
    }, [notification]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await authFetch(`${API_URL}/api/product-requests`);
            if (!response.ok) throw new Error("Gagal memuat data request");
            const data = await parseJson<ProductRequest[]>(response);
            setRequests(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat request");
        } finally {
            setLoading(false);
        }
    };

    const refreshRequests = async () => {
        setRefreshing(true);
        await fetchRequests();
        setRefreshing(false);
    };

    const formatDate = (value?: string | null) => {
        if (!value) return "—";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return new Intl.DateTimeFormat("id-ID", {
            dateStyle: "long",
            timeStyle: "short",
        }).format(date);
    };

    const formatDepartureDate = (value?: string | null) => {
        if (!value) return "—";
        const date = new Date(`${value}T00:00:00`);
        if (Number.isNaN(date.getTime())) return value;
        return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(date);
    };

    const formatDepartureTime = (value?: string | null) => value ? `${value.slice(0, 5)} WIB` : "—";

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "pending_approval":
                return "Menunggu Tester";
            case "taken":
                return "Menunggu Tester";
            case "fulfilled":
                return "Terpenuhi";
            case "unfulfilled":
                return "Tidak Terpenuhi";
            case "expired":
                return "Kedaluwarsa";
            case "completed":
                return "Selesai";
            case "cancelled":
                return "Dibatalkan";
            default:
                return "Terbuka";
        }
    };

    const getStatusClasses = (status: string) => {
        switch (status) {
            case "pending_approval":
                return "bg-amber-100 text-amber-700";
            case "taken":
                return "bg-amber-100 text-amber-700";
            case "fulfilled":
                return "bg-blue-100 text-blue-700";
            case "unfulfilled":
            case "expired":
                return "bg-slate-200 text-slate-700";
            case "completed":
                return "bg-purple-100 text-purple-700";
            case "cancelled":
                return "bg-rose-100 text-rose-700";
            default:
                return "bg-emerald-100 text-emerald-700";
        }
    };

    const getDetailStatusClasses = (status?: string) => {
        switch (status) {
            case "Terpenuhi":
            case "Masuk ke Mitra":
                return "bg-blue-100 text-blue-700";
            case "Tidak Terpenuhi":
                return "bg-slate-200 text-slate-700";
            case "Selesai Dititip":
                return "bg-emerald-100 text-emerald-700";
            case "Sudah Diantar":
                return "bg-blue-100 text-blue-700";
            case "Menunggu Pengantaran":
                return "bg-amber-100 text-amber-700";
            case "Retur":
                return "bg-rose-100 text-rose-700";
            case "Menunggu Persetujuan":
                return "bg-slate-200 text-slate-700";
            default:
                return getStatusClasses(selectedRequest?.status || "open");
        }
    };

    const getDetailStatusLabel = (request: ProductRequestDetail) => {
        if (request.status === "unfulfilled") return "Tidak Terpenuhi";
        if (request.history_status === "Masuk ke Mitra") return "Terpenuhi";
        return request.history_status || getStatusLabel(request.status);
    };

    const handleDecision = async (id: number, decision: "approve" | "reject", reason?: string) => {
        try {
            const response = await authFetch(`${API_URL}/api/product-requests/${id}/${decision}`, {
                method: "POST",
                body: decision === "reject" ? JSON.stringify({ rejection_reason: reason }) : undefined,
            });
            if (!response.ok) {
                const json = await parseJson<{ message?: string }>(response);
                throw new Error(json.message || "Gagal memproses request");
            }

            const result = await parseJson<{ request: ProductRequest }>(response);
            setRequests((previous) => previous.map((item) => item.id === id ? result.request : item));
            setSelectedRequest((previous) => previous?.id === id ? result.request : previous);
            setNotification({
                type: "success",
                message: decision === "approve" ? "Request disetujui. Produk masuk katalog setelah pengantaran dikonfirmasi." : "Request ditolak dan dibuka kembali untuk UMKM.",
            });
        } catch (err: unknown) {
            setNotification({ type: "error", message: err instanceof Error ? err.message : "Terjadi kesalahan saat memproses request" });
        }
    };

    const handleRejectSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!rejectingRequestId || rejectionReason.trim().length < 5) return;

        await handleDecision(rejectingRequestId, "reject", rejectionReason.trim());
        setRejectingRequestId(null);
        setRejectionReason("");
    };

    const handleOfferDecision = async (requestId: number, offerId: number, decision: "approve" | "reject") => {
        try {
            const response = await authFetch(`${API_URL}/api/product-requests/${requestId}/offers/${offerId}/${decision}`, { method: "POST" });
            if (!response.ok) {
                const json = await parseJson<{ message?: string }>(response);
                throw new Error(json.message || "Gagal memproses peserta tester");
            }

            const result = await parseJson<{ request: ProductRequest }>(response);
            setRequests((previous) => previous.map((item) => item.id === requestId ? result.request : item));
            setSelectedRequest((previous) => previous?.id === requestId ? result.request : previous);
            setNotification({ type: "success", message: decision === "approve" ? "Peserta disetujui dan produk masuk ke mitra." : "Peserta ditolak." });
        } catch (err: unknown) {
            setNotification({ type: "error", message: err instanceof Error ? err.message : "Terjadi kesalahan saat memproses peserta tester" });
        }
    };

    const handleConfirmDelivery = async (id: number) => {
        if (!window.confirm("Pastikan produk sudah diantar ke Mitra. Lanjutkan konfirmasi?")) return;

        try {
            const response = await authFetch(`${API_URL}/api/product-requests/${id}/confirm-delivery`, { method: "POST" });
            if (!response.ok) {
                const json = await parseJson<{ message?: string }>(response);
                throw new Error(json.message || "Gagal mengonfirmasi pengantaran");
            }

            const result = await parseJson<{ request: ProductRequest }>(response);
            setRequests((previous) => previous.map((item) => item.id === id ? result.request : item));
            setSelectedRequest((previous) => previous?.id === id ? result.request : previous);
            setNotification({ type: "success", message: "Pengantaran produk berhasil dikonfirmasi." });
        } catch (err: unknown) {
            setNotification({ type: "error", message: err instanceof Error ? err.message : "Terjadi kesalahan saat mengonfirmasi pengantaran" });
        }
    };

    const handleOpenDetail = async (id: number) => {
        setIsDetailModalOpen(true);
        setDetailLoading(true);
        setDetailError(null);
        setSelectedRequest(null);

        try {
            const response = await authFetch(`${API_URL}/api/product-requests/${id}`);
            if (!response.ok) throw new Error("Gagal memuat detail request");
            const data = await parseJson<ProductRequestDetail>(response);
            setSelectedRequest(data);
        } catch (err: unknown) {
            setDetailError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat detail request");
        } finally {
            setDetailLoading(false);
        }
    };

    const handleCloseDetail = () => {
        setIsDetailModalOpen(false);
        setSelectedRequest(null);
        setDetailError(null);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const response = await authFetch(`${API_URL}/api/product-requests`, {
                method: "POST",
                body: JSON.stringify({
                    ...formData,
                    reference_price: Number(formData.reference_price),
                    partner_profit: Number(formData.partner_profit),
                }),
            });

            if (!response.ok) {
                let message = "Gagal menyimpan request";
                try {
                    const json = await parseJson<{ message?: string }>(response);
                    message = json.message || message;
                } catch {
                    message = `Error ${response.status}: ${response.statusText}`;
                }
                throw new Error(message);
            }

            const newRequest = await parseJson<ProductRequest>(response);
            setRequests([{ ...newRequest, status: newRequest.status ?? 'open' }, ...requests]);
            setIsModalOpen(false);
            setFormData({ name: "", category: "Makanan", quantity: 1, reference_price: "", partner_profit: "", hotel_departure_date: "", purpose: "Mencari UMKM Penyedia Stok Produk" });
            setNotification({ type: "success", message: "Request produk berhasil dibuat." });
        } catch (err: unknown) {
            setNotification({ type: "error", message: err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan request" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            const response = await authFetch(`${API_URL}/api/product-requests/${id}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Gagal menghapus request");
            setRequests(requests.filter((item) => item.id !== id));
            setNotification({ type: "success", message: "Request produk berhasil dihapus." });
        } catch (err: unknown) {
            setNotification({ type: "error", message: err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus request" });
        } finally {
            setDeletingRequestId(null);
        }
    };

    const filtered = requests.filter((item) => {
        const term = searchTerm.toLowerCase();
        return (
            item.name.toLowerCase().includes(term) ||
            item.category.toLowerCase().includes(term) ||
            item.purpose?.toLowerCase().includes(term) ||
            item.status.toLowerCase().includes(term) ||
            item.taken_by_umkm?.owner?.toLowerCase().includes(term)
        );
    });

    return (
        <div className="space-y-6 pb-24 font-sans text-gray-800">
            {notification && <Toast type={notification.type} message={notification.message} onClose={() => setNotification(null)} />}

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-blue-950 mb-2">Request Produk</h1>
                    <p className="text-gray-500 text-sm md:text-base">Buat dan kelola permintaan produk untuk UMKM mengambil dan membuat produk.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={refreshRequests}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl border border-slate-200 transition-all active:scale-95 cursor-pointer"
                    >
                        {refreshing ? "Menyegarkan..." : "Segarkan"}
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                    >
                        <Plus size={20} /> Tambah Request
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 bg-white px-2 py-1.5 rounded-3xl shadow-sm border border-gray-100 flex items-center focus-within:ring-2 focus-within:ring-blue-600/20 focus-within:border-blue-600 transition-all">
                    <div className="pl-4 pr-2">
                        <Search className="text-blue-400" size={22} />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari nama request, kategori, atau status..."
                        className="w-full bg-transparent px-2 py-3 outline-none text-sm font-medium text-gray-800"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-4xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="relative h-64 flex items-center justify-center text-blue-600 flex-col gap-4">
                        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        <p className="font-bold text-sm tracking-widest uppercase">Memuat Request...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-red-500 font-bold bg-red-50">Error: {error}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-gray-50/80">
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">No</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Request</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Kategori</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100 text-center">Kuantitas</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Harga Produk</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Keuntungan</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Status</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Peserta Tester</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((item, index) => (
                                    <tr key={item.id} className={`transition-colors group ${item.status === "taken" && !item.delivered_to_partner_at ? "bg-amber-50 hover:bg-amber-100/70" : "hover:bg-blue-50/40"}`}>
                                        <td className="py-4 px-6 text-sm font-bold text-gray-400">{index + 1}</td>
                                        <td className="py-4 px-6">
                                            <div className="space-y-1">
                                                <p className="text-sm font-extrabold text-gray-900">{item.name}</p>
                                                <p className="text-xs text-gray-500 line-clamp-2 max-w-xs">{item.purpose || 'Tidak ada tujuan'}</p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[11px] font-bold uppercase tracking-wider">
                                                <Tag size={12} /> {item.category}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center font-bold text-gray-700">{item.quantity}</td>
                                        <td className="py-4 px-6 text-sm font-semibold text-gray-700">
                                            {item.reference_price !== null && item.reference_price !== undefined
                                                ? `Rp ${Number(item.reference_price).toLocaleString('id-ID')}`
                                                : '—'}
                                        </td>
                                        <td className="py-4 px-6 text-sm font-semibold text-emerald-700">{item.partner_profit ? `Rp ${Number(item.partner_profit).toLocaleString('id-ID')}` : '—'}</td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${getStatusClasses(item.status)}`}>
                                                {getStatusLabel(item.status)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-sm font-semibold text-gray-700">
                                            {item.offers?.length ? `${item.offers.length} peserta` : "Belum"}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {item.offers?.length ? (
                                                    <button
                                                        type="button"
                                                        className="px-4 py-2 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-all text-sm font-semibold cursor-pointer"
                                                        onClick={() => handleOpenDetail(item.id)}
                                                    >
                                                        Lihat Peserta
                                                    </button>
                                                ) : null}
                                                <button
                                                    className="px-4 py-2 rounded-2xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all text-sm font-semibold cursor-pointer"
                                                    onClick={() => setDeletingRequestId(item.id)}
                                                    title="Hapus Request"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="py-16 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Package size={40} className="text-gray-300" />
                                                <p className="font-bold text-gray-700">Tidak ada request produk.</p>
                                                <p className="text-sm text-gray-500">Buat request baru untuk memicu UMKM mengembangkan produk Anda.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isDetailModalOpen}
                onClose={handleCloseDetail}
                title="Detail Request Produk"
            >
                {detailLoading ? (
                    <div className="flex items-center justify-center py-10 text-blue-600">
                        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mr-3"></div>
                        <span className="font-semibold">Memuat detail request...</span>
                    </div>
                ) : detailError ? (
                    <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600">{detailError}</div>
                ) : selectedRequest ? (
                    <div className="space-y-5">
                        <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Request</p>
                                    <h3 className="mt-1 text-xl font-extrabold text-gray-900">{selectedRequest.name}</h3>
                                </div>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${getDetailStatusClasses(selectedRequest.history_status)}`}>
                                    {getDetailStatusLabel(selectedRequest)}
                                </span>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Nama Produk</p>
                                <p className="mt-2 text-sm font-semibold text-gray-800">{selectedRequest.name}</p>
                            </div>
                            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Kategori</p>
                                <p className="mt-2 text-sm font-semibold text-gray-800">{selectedRequest.category}</p>
                            </div>
                            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Kuantitas</p>
                                <p className="mt-2 text-sm font-semibold text-gray-800">{selectedRequest.quantity}</p>
                            </div>
                            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Tujuan Permintaan</p>
                                <p className="mt-2 text-sm font-semibold text-gray-800">{selectedRequest.purpose || "—"}</p>
                            </div>
                            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Harga Keuntungan Mitra</p>
                                <p className="mt-2 text-sm font-semibold text-gray-800">{selectedRequest.partner_profit ? `Rp ${Number(selectedRequest.partner_profit).toLocaleString("id-ID")}` : "—"}</p>
                            </div>
                            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Tanggal Tester</p>
                                <p className="mt-2 text-sm font-semibold text-gray-800">{formatDepartureDate(selectedRequest.hotel_departure_date)}</p>
                            </div>
                            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Tanggal Dibuat</p>
                                <p className="mt-2 text-sm font-semibold text-gray-800">{formatDate(selectedRequest.created_at)}</p>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Peserta Tester</p>
                                <span className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold text-blue-700">
                                    {selectedRequest.offers?.length || 0} peserta
                                </span>
                            </div>
                            {selectedRequest.offers?.length ? (
                                <div className="mt-4 space-y-3">
                                    {selectedRequest.offers.map((offer) => (
                                        <div key={offer.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-200">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-extrabold text-gray-900">{offer.umkm?.name || "UMKM"}</p>
                                                </div>
                                                <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${offer.status === "approved" ? "bg-emerald-100 text-emerald-700" : offer.status === "rejected" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
                                                    {offer.status === "approved" ? "Disetujui" : offer.status === "rejected" ? "Ditolak" : "Menunggu Tester"}
                                                </span>
                                            </div>
                                            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Harga Produk</p>
                                                    <p className="mt-1 text-sm font-bold text-gray-800">Rp {Number(offer.price_offered).toLocaleString("id-ID")}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Stok</p>
                                                    <p className="mt-1 text-sm font-bold text-gray-800">{offer.quantity_offered || selectedRequest.quantity} unit</p>
                                                </div>
                                            </div>
                                            {offer.status === "pending" ? (
                                                <div className="mt-4 flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        className="rounded-xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-600 hover:text-white"
                                                        onClick={() => void handleOfferDecision(selectedRequest.id, offer.id, "approve")}
                                                    >
                                                        Setujui Tester
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="rounded-xl bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-600 hover:text-white"
                                                        onClick={() => void handleOfferDecision(selectedRequest.id, offer.id, "reject")}
                                                    >
                                                        Tolak
                                                    </button>
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="mt-3 text-sm font-semibold text-gray-600">Belum ada UMKM yang mengambil request ini.</p>
                            )}
                        </div>
                    </div>
                ) : null}
            </Modal>

            <Modal
                isOpen={rejectingRequestId !== null}
                onClose={() => {
                    setRejectingRequestId(null);
                    setRejectionReason("");
                }}
                title="Alasan Penolakan"
            >
                <form onSubmit={handleRejectSubmit} className="space-y-5 px-1 py-2">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2" htmlFor="rejection-reason">
                            Alasan penolakan
                        </label>
                        <textarea
                            id="rejection-reason"
                            required
                            minLength={5}
                            rows={4}
                            value={rejectionReason}
                            onChange={(event) => setRejectionReason(event.target.value)}
                            placeholder="Tuliskan alasan penolakan agar dapat diketahui UMKM"
                            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800 outline-none transition-all focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20"
                        />
                        <p className="mt-2 text-xs text-gray-500">Minimal 5 karakter.</p>
                    </div>
                    <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
                        <button
                            type="button"
                            className="rounded-xl px-6 py-2.5 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-100"
                            onClick={() => {
                                setRejectingRequestId(null);
                                setRejectionReason("");
                            }}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={rejectionReason.trim().length < 5}
                            className="rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-blue-950 transition-all hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Tolak Request
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={deletingRequestId !== null}
                onClose={() => setDeletingRequestId(null)}
                title="Hapus Request Produk"
            >
                <div className="space-y-5 px-1 py-2">
                    <div role="alert" className="flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-rose-900">
                        <Trash2 size={20} className="mt-0.5 shrink-0 text-rose-600" />
                        <div>
                            <p className="text-sm font-extrabold">Konfirmasi penghapusan</p>
                            <p className="mt-1 text-sm leading-6">
                                Apakah Anda yakin ingin menghapus request <strong>{requests.find((item) => item.id === deletingRequestId)?.name || "ini"}</strong>? Data yang dihapus tidak dapat dikembalikan.
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
                        <button
                            type="button"
                            className="rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50"
                            onClick={() => setDeletingRequestId(null)}
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            className="rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-600/20 transition-all hover:bg-rose-700 active:scale-95"
                            onClick={() => {
                                if (deletingRequestId !== null) void handleDelete(deletingRequestId);
                            }}
                        >
                            Hapus Request
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Buat Request Produk Baru"
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-6 px-1 py-1">
                    {/* Step 1: Informasi Produk */}
                    <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 space-y-4">
                        <div className="flex items-center gap-2 border-b border-gray-200/60 pb-2.5">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">1</span>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Informasi Produk</h4>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Nama Produk</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm font-semibold text-gray-800 shadow-sm"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Contoh: Sambal Korek Instan"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Kategori</label>
                                <select
                                    required
                                    className="w-full px-3.5 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm font-semibold text-gray-800 cursor-pointer shadow-sm"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="Makanan">Makanan</option>
                                    <option value="Minuman">Minuman</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Stok yang Dibutuhkan</label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    className="w-full px-3.5 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm font-semibold text-gray-800 shadow-sm"
                                    value={formData.quantity || ''}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/^0+/, '');
                                        setFormData({ ...formData, quantity: raw === '' ? 0 : Number(raw) });
                                    }}
                                    placeholder="Contoh: 10"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Tujuan Permintaan</label>
                                <select
                                    required
                                    value={formData.purpose}
                                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                    className="w-full px-3.5 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm font-semibold text-gray-800 cursor-pointer shadow-sm"
                                >
                                    {purposeOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Ketentuan & Jadwal */}
                    <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 space-y-4">
                        <div className="flex items-center gap-2 border-b border-gray-200/60 pb-2.5">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">2</span>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Harga & Jadwal</h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Harga Produk</label>
                                <div className="flex items-center rounded-xl border border-gray-200 bg-white shadow-sm transition-all focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20">
                                    <span className="pl-3.5 text-xs font-bold text-gray-400">Rp</span>
                                    <input
                                        type="number"
                                        min="0"
                                        required
                                        className="w-full bg-transparent px-2 py-3 outline-none text-sm font-semibold text-gray-800"
                                        value={formData.reference_price}
                                        onChange={(e) => setFormData({ ...formData, reference_price: e.target.value })}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Keuntungan Mitra</label>
                                <div className="flex items-center rounded-xl border border-gray-200 bg-white shadow-sm transition-all focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20">
                                    <span className="pl-3.5 text-xs font-bold text-gray-400">Rp</span>
                                    <input
                                        type="number"
                                        min="0"
                                        required
                                        className="w-full bg-transparent px-2 py-3 outline-none text-sm font-semibold text-gray-800"
                                        value={formData.partner_profit || ''}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/^0+/, '');
                                            setFormData({ ...formData, partner_profit: raw });
                                        }}
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Pengantaran Tester</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-3.5 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm font-semibold text-gray-800 shadow-sm cursor-pointer"
                                    value={formData.hotel_departure_date}
                                    onChange={(e) => setFormData({ ...formData, hotel_departure_date: e.target.value })}
                                />
                            </div>

                        </div>
                    </div>

                    <div className="flex justify-end pt-3 space-x-3 border-t border-gray-100">
                        <button
                            type="button"
                            disabled={isSubmitting}
                            className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Batalkan
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? "Menyimpan..." : "Simpan Request"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
