"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Plus, Search, Package, Tag, Trash2 } from "lucide-react";
import { Modal } from "@/components/Modal";
import Toast from "@/components/Toast";
import { API_URL, authFetch, parseJson } from "@/lib/auth";

interface ProductRequest {
    id: number;
    name: string;
    category: string;
    quantity: number;
    reference_price: number | null;
    price_offered: number | null;
    purpose?: string | null;
    status: "open" | "taken" | "completed" | "cancelled";
    taken_by_umkm?: { id: number; owner: string } | null;
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
    const [formData, setFormData] = useState<RequestForm>({
        name: "",
        category: "Makanan",
        quantity: 1,
        reference_price: "",
        purpose: "",
    });

    const purposeOptions = [
        { value: "", label: "Pilih tujuan permintaan" },
        { value: "Menambah Stok Produk", label: "Menambah Stok Produk" },
        { value: "Memenuhi Permintaan Pelanggan", label: "Memenuhi Permintaan Pelanggan" },
        { value: "Persiapan Penjualan", label: "Persiapan Penjualan" },
        { value: "Kebutuhan Event/Promosi", label: "Kebutuhan Event/Promosi" },
        { value: "Pengembangan Produk Baru", label: "Pengembangan Produk Baru" },
        { value: "Kerja Sama dengan UMKM", label: "Kerja Sama dengan UMKM" },
        { value: "Lainnya", label: "Lainnya" },
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

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const response = await authFetch(`${API_URL}/api/product-requests`, {
                method: "POST",
                body: JSON.stringify({
                    ...formData,
                    reference_price: formData.reference_price === "" ? null : Number(formData.reference_price),
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
            setFormData({ name: "", category: "Makanan", quantity: 1, reference_price: "", purpose: "" });
            setNotification({ type: "success", message: "Request produk berhasil dibuat." });
        } catch (err: unknown) {
            setNotification({ type: "error", message: err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan request" });
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Hapus request produk ini?")) return;

        try {
            const response = await authFetch(`${API_URL}/api/product-requests/${id}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Gagal menghapus request");
            setRequests(requests.filter((item) => item.id !== id));
            setNotification({ type: "success", message: "Request produk berhasil dihapus." });
        } catch (err: unknown) {
            setNotification({ type: "error", message: err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus request" });
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
                        className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl border border-slate-200 transition-all active:scale-95"
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
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">ID</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Request</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Kategori</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100 text-center">Kuantitas</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Budget</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Harga UMKM</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Status</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">UMKM</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((item) => (
                                    <tr key={item.id} className="hover:bg-blue-50/40 transition-colors group">
                                        <td className="py-4 px-6 text-sm font-bold text-gray-400">#{item.id}</td>
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
                                        <td className="py-4 px-6 text-sm font-semibold text-gray-700">{item.reference_price ? `Rp ${Number(item.reference_price).toLocaleString('id-ID')}` : '—'}</td>
                                        <td className="py-4 px-6 text-sm font-semibold text-gray-700">{item.price_offered ? `Rp ${Number(item.price_offered).toLocaleString('id-ID')}` : '—'}</td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${item.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                                                {item.status === 'open' ? 'Terbuka' : 'Diambil'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-sm font-semibold text-gray-700">{item.taken_by_umkm?.owner || 'Belum'}</td>
                                        <td className="py-4 px-6 text-right">
                                            <button
                                                className="px-4 py-2 rounded-2xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all text-sm font-semibold"
                                                onClick={() => handleDelete(item.id)}
                                                title="Hapus Request"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="py-16 text-center text-gray-500">
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
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Buat Request Produk Baru"
            >
                <form onSubmit={handleSubmit} className="space-y-5 px-1 py-2">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Nama Produk</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm font-semibold text-gray-800"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Contoh: Sambal Korek Instan"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Kategori</label>
                            <select
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm font-semibold text-gray-800 cursor-pointer"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="Makanan">Makanan</option>
                                <option value="Minuman">Minuman</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Kuantitas</label>
                            <input
                                type="number"
                                min="1"
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm font-semibold text-gray-800"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Budget Referensi</label>
                            <input
                                type="number"
                                min="0"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm font-semibold text-gray-800"
                                value={formData.reference_price}
                                onChange={(e) => setFormData({ ...formData, reference_price: e.target.value })}
                                placeholder="Opsional"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Tujuan Permintaan</label>
                        <select
                            required
                            value={formData.purpose}
                            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm font-semibold text-gray-800 cursor-pointer"
                        >
                            {purposeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end pt-5 space-x-3 border-t border-gray-100 mt-6">
                        <button
                            type="button"
                            className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Batalkan
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-95"
                        >
                            Simpan Request
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
