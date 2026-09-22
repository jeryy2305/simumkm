"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Edit, ClipboardList, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Modal } from "@/components/Modal";
import Toast from "@/components/Toast";
import { API_URL, authFetch, parseJson } from "@/lib/auth";
import { Hotel, Umkm, Product, Consignment, ConsignmentFormData } from "@/lib/types";

type FormData = ConsignmentFormData;
type Status = "active" | "completed" | "cancelled";

function isStatus(value: string): value is Status {
  return ["active", "completed", "cancelled"].includes(value);
}

export default function DataPenitipan() {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterOwner, setFilterOwner] = useState("");
    const [consignments, setConsignments] = useState<Consignment[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [umkms, setUmkms] = useState<Umkm[]>([]);
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

    const activeUmkms = umkms.filter((u) => u.status === 'active');
    const consignedProductIds = new Set(consignments.map((consignment) => Number(consignment.product_id)));
    const availableProducts = products.filter((p) =>
        p.status === 'available' &&
        p.umkm?.status === 'active' &&
        !consignedProductIds.has(Number(p.id))
    );
    const verifiedHotels = hotels.filter((h) => h.verified === true);
    // CRUD States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<Consignment | null>(null);
    const [selectedProductInfo, setSelectedProductInfo] = useState<{ price: number | null; partner_profit: number | null; hotel_price: number | null; quantity: number | null }>({ price: null, partner_profit: null, hotel_price: null, quantity: null });
    const [formData, setFormData] = useState<FormData>({
        company: '',
        product_id: '',
        umkm_id: '',
        quantity: 0,
        duration_days: 0,
        start_date: '',
        status: 'completed'
    });

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (!notification) return;
        const timer = window.setTimeout(() => setNotification(null), 4000);
        return () => window.clearTimeout(timer);
    }, [notification]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [consRes, prodRes, umkmRes, hotelRes] = await Promise.all([
                authFetch(`${API_URL}/api/consignments`),
                authFetch(`${API_URL}/api/products`),
                authFetch(`${API_URL}/api/umkms`),
                authFetch(`${API_URL}/api/hotels`)
            ]);

            if (!consRes.ok || !prodRes.ok || !umkmRes.ok || !hotelRes.ok) throw new Error('Failed to fetch data');

            const consignmentData = await parseJson<Consignment[]>(consRes);
            setConsignments(consignmentData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
            setProducts(await parseJson<Product[]>(prodRes));
            setUmkms(await parseJson<Umkm[]>(umkmRes));
            setHotels(await parseJson<Hotel[]>(hotelRes));
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const fetchConsignments = async () => {
        try {
            const response = await authFetch(`${API_URL}/api/consignments`);
            if (response.ok) {
                const data = await parseJson<Consignment[]>(response);
                setConsignments(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
            }
        } catch {
            // ignore refresh failure while preserving current list
        }
    };

    const filteredData = consignments.filter(item => {
        const isActiveUmkm = item.umkm?.status === "active";
        const matchesSearch = item.id.toString().includes(searchTerm.toLowerCase()) ||
            (item.umkm?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.product?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.company || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesOwner = filterOwner === "" || (item.umkm && item.umkm.owner === filterOwner);
        return isActiveUmkm && matchesSearch && matchesOwner;
    });

    const handleAdd = () => {
        setFormData({
            company: '', product_id: '', umkm_id: '',
            quantity: 0,
            duration_days: 30, start_date: new Date().toISOString().split('T')[0], status: 'completed'
        });
        setSelectedProductInfo({ price: null, partner_profit: null, hotel_price: null, quantity: null });
        setIsModalOpen(true);
    };

    const handleEditClick = (item: Consignment) => {
        const formattedDate = item.start_date ? new Date(item.start_date).toISOString().split('T')[0] : '';
        setEditItem({
            ...item,
            start_date: formattedDate
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editItem) return;
        try {
            const payload = {
                company: editItem.company,
                duration_days: editItem.duration_days,
                start_date: editItem.start_date,
                status: editItem.status
            };
            const response = await authFetch(`${API_URL}/api/consignments/${editItem.id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error('Gagal mengupdate data');
            await fetchConsignments();
            setIsEditModalOpen(false);
            setNotification({ type: 'success', message: 'Data penitipan berhasil diperbarui.' });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Gagal mengupdate data';
            setNotification({ type: 'error', message });
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus arsip penitipan ini?")) return;
        try {
            const response = await authFetch(`${API_URL}/api/consignments/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Gagal menghapus data');
            setConsignments((current) => current.filter((c) => c.id !== id));
            setNotification({ type: 'success', message: 'Arsip penitipan berhasil dihapus.' });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Gagal menghapus data';
            setNotification({ type: 'error', message });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await authFetch(`${API_URL}/api/consignments`, {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            if (!response.ok) throw new Error('Gagal menyimpan data');
            await fetchConsignments();
            setIsModalOpen(false);
            setNotification({ type: 'success', message: 'Data penitipan berhasil disimpan.' });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Gagal menyimpan data';
            setNotification({ type: 'error', message });
        }
    };

    // Auto-select UMKM based on Product + auto-fill harga & stok
    const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const prodId = e.target.value;
        const selectedProd = products.find(p => p.id.toString() === prodId);
        setFormData({
            ...formData,
            product_id: prodId,
            umkm_id: selectedProd ? selectedProd.umkm_id.toString() : '',
            quantity: selectedProd ? selectedProd.quantity : 0
        });
        const price = selectedProd ? (Number(selectedProd.price) || 0) : 0;
        const partnerProfit = selectedProd ? (Number(selectedProd.partner_profit) || 0) : 0;
        const hotelPrice = selectedProd ? (Number(selectedProd.hotel_price) || (price + partnerProfit)) : 0;
        setSelectedProductInfo({
            price: selectedProd ? price : null,
            partner_profit: selectedProd ? partnerProfit : null,
            hotel_price: selectedProd ? hotelPrice : null,
            quantity: selectedProd ? selectedProd.quantity : null
        });
    };

    return (
        <div className="space-y-6 md:pb-24 font-sans text-gray-800">
            {notification && <Toast type={notification.type} message={notification.message} onClose={() => setNotification(null)} />}
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-blue-950 mb-2">Administrasi Penitipan</h1>
                    <p className="text-gray-500 text-sm md:text-base">Pusat data lalu lintas penyaluran produk UMKM ke perhotelan.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleAdd}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-blue-950 font-extrabold rounded-2xl shadow-lg shadow-amber-500/30 transition-all hover:-translate-y-0.5 active:scale-95 whitespace-nowrap cursor-pointer"
                    >
                        <Plus size={20} /> Rekam Titipan Baru
                    </button>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 bg-white px-2 py-1.5 rounded-3xl shadow-sm border border-gray-100 flex items-center focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-500 transition-all">
                    <div className="pl-4 pr-2">
                        <Search className="text-amber-500" size={22} />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari No Mitra, Perusahaan Tujuan, atau Produk..."
                        className="w-full bg-transparent px-2 py-3 outline-none text-sm font-medium text-gray-800"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-72 shrink-0 bg-white p-2 rounded-3xl shadow-sm border border-gray-100">
                    <select
                        className="w-full px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-50/80 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 transition-all cursor-pointer"
                        value={filterOwner}
                        onChange={(e) => setFilterOwner(e.target.value)}
                    >
                        <option value="">Filter Berdasarkan UMKM...</option>
                        {Array.from(new Set(activeUmkms.map((u) => u.owner))).map((owner) => (
                            <option key={owner} value={owner}>{owner}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Content Table / Cards layout */}
            <div className="bg-white rounded-4xl border border-gray-100 shadow-sm overflow-hidden p-2">
                {loading ? (
                    <div className="relative h-64 flex items-center justify-center text-amber-500 flex-col gap-4">
                        <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
                        <p className="font-bold text-sm tracking-widest uppercase">Sinkronisasi Data...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-red-500 font-bold bg-red-50">Error: {error}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-gray-50/80">
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">No</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Mitra</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Alokasi Tujuan</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Nama Produk</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Harga Jual</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Stok</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Kondisi Status</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100 text-right">Opsi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredData.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-amber-50/30 transition-colors group">
                                        <td className="py-5 px-6 text-sm font-bold text-amber-600">
                                            {index + 1}
                                        </td>
                                        <td className="py-5 px-6">
                                            <span className="text-sm font-extrabold text-blue-950 group-hover:text-blue-700 transition-colors">{item.umkm?.owner || 'Tanpa Pemilik'}</span>
                                        </td>
                                        <td className="py-5 px-6">
                                            <span className="text-sm font-extrabold text-gray-800">{item.company || '-'}</span>
                                        </td>
                                        <td className="py-5 px-6">
                                            <span className="text-sm font-semibold text-gray-700">{item.product?.name || 'Produk Unknown'}</span>
                                        </td>
                                        <td className="py-5 px-6">
                                            {item.product?.price != null ? (
                                                <span className="text-sm font-extrabold text-blue-950 bg-blue-50/50 px-2.5 py-1 rounded-lg border border-blue-100">
                                                    Rp {Number(item.product.hotel_price ?? (Number(item.product.price) + Number(item.product.partner_profit || 0))).toLocaleString('id-ID')}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="py-5 px-6">
                                            {item.product?.quantity != null ? (
                                                <span className="text-sm font-extrabold text-blue-950 bg-blue-50/50 px-2.5 py-1 rounded-lg border border-blue-100">
                                                    {item.product.quantity} unit
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${item.status === 'active' || item.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    'bg-red-50 text-red-700 border-red-200'
                                                }`}>
                                                {item.status === 'active' && <Clock size={12} className="shrink-0" />}
                                                {item.status === 'completed' && <CheckCircle2 size={12} className="shrink-0" />}
                                                {item.status === 'cancelled' && <XCircle size={12} className="shrink-0" />}
                                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                                    {item.status === "active" || item.status === "completed" ? "Selesai" : "Retur"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleEditClick(item)}
                                                    className="p-2 bg-gray-50 text-gray-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all border border-gray-100 shadow-sm cursor-pointer"
                                                    title="Ubah Kondisi Data"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 bg-gray-50 text-gray-600 hover:bg-red-600 hover:text-white rounded-xl transition-all border border-gray-100 shadow-sm cursor-pointer"
                                                    title="Hapus Arsen"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredData.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={8} className="py-20 text-center">
                                            <div className="flex flex-col items-center">
                                                <ClipboardList size={40} className="text-gray-200 mb-4" />
                                                <p className="font-extrabold text-gray-500">Tidak Log Penitipan</p>
                                                <p className="text-sm text-gray-400 mt-1 max-w-sm">Coba gunakan kata kunci pencarian yang lain atau daftarkan rekaman titipan baru.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Delegasi Penitipan Baru" size="lg">
                <form onSubmit={handleSubmit} className="space-y-6 px-1 py-2">
                    {/* Step 1: Pilih Produk */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-extrabold">1</span>
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Pilih Produk</label>
                        </div>
                        <select
                            required
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm font-semibold text-gray-800 cursor-pointer"
                            value={formData.product_id}
                            onChange={handleProductChange}
                        >
                            <option value="" disabled>Pilih Katalog Inventaris...</option>
                            {availableProducts.map(prod => (
                                <option key={prod.id} value={prod.id}>{prod.name} (Owner: {prod.umkm?.owner})</option>
                            ))}
                        </select>
                    </div>

                    {/* Info Produk: Rincian Harga & Stok */}
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 space-y-4">
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-slate-400">Rincian Produk</p>

                        {/* Harga Produk & Keuntungan Mitra — 2 kolom */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Harga Produk</label>
                                <div className={`px-3.5 py-2.5 rounded-lg border text-sm font-semibold transition-all ${selectedProductInfo.price !== null
                                        ? 'bg-white border-gray-200 text-gray-800'
                                        : 'bg-gray-100/60 border-gray-100 text-gray-400 text-xs'
                                    }`}>
                                    {selectedProductInfo.price !== null
                                        ? `Rp ${Number(selectedProductInfo.price).toLocaleString('id-ID')}`
                                        : '—'}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Keuntungan Mitra</label>
                                <div className={`px-3.5 py-2.5 rounded-lg border text-sm font-semibold transition-all ${selectedProductInfo.partner_profit !== null
                                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-700'
                                        : 'bg-gray-100/60 border-gray-100 text-gray-400 text-xs'
                                    }`}>
                                    {selectedProductInfo.partner_profit !== null
                                        ? `+ Rp ${Number(selectedProductInfo.partner_profit).toLocaleString('id-ID')}`
                                        : '—'}
                                </div>
                            </div>
                        </div>

                        {/* Harga Jual — full width, prominent */}
                        <div className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${selectedProductInfo.hotel_price !== null
                                ? 'bg-blue-50 border-blue-200'
                                : 'bg-gray-50 border-gray-100'
                            }`}>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Harga Jual</span>
                            <span className={`text-base font-extrabold transition-all ${selectedProductInfo.hotel_price !== null ? 'text-blue-700' : 'text-gray-400 text-sm'}`}>
                                {selectedProductInfo.hotel_price !== null
                                    ? `Rp ${Number(selectedProductInfo.hotel_price).toLocaleString('id-ID')}`
                                    : '—'}
                            </span>
                        </div>

                        {/* Stok — compact */}
                        <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-white border border-gray-100">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Stok Tersedia</span>
                            <span className={`text-sm font-bold ${formData.quantity > 0 ? 'text-gray-800' : 'text-gray-400'}`}>
                                {formData.quantity > 0 ? `${formData.quantity} unit` : '—'}
                            </span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium italic -mt-2">* Otomatis mengambil seluruh stok tersedia</p>
                    </div>

                    {/* Step 2: Tujuan & Tanggal */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-extrabold">2</span>
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Detail Distribusi</label>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Hotel Tujuan</label>
                                <select
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm font-semibold text-gray-800 cursor-pointer"
                                    value={formData.company}
                                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                                >
                                    <option value="" disabled>Pilih Hotel...</option>
                                    {verifiedHotels.length > 0 ? verifiedHotels.map(hotel => (
                                        <option key={hotel.id} value={hotel.name}>{hotel.name}</option>
                                    )) : (
                                        <option value="" disabled>Tidak ada hotel terverifikasi</option>
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Tanggal Berangkat</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm font-semibold text-gray-800"
                                    value={formData.start_date}
                                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end pt-5 space-x-3 border-t border-gray-100 mt-6">
                        <button type="button" className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer" onClick={() => setIsModalOpen(false)}>Kembali</button>
                        <button type="submit" className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-blue-950 text-sm font-extrabold rounded-xl shadow-lg shadow-amber-500/30 transition-all active:scale-95 cursor-pointer">Simpan Catatan</button>
                    </div>
                </form>
            </Modal>

            {/* Edit Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Pembaruan Log Data">
                {editItem && (
                    <form onSubmit={handleEditSubmit} className="space-y-5 px-1 py-2">
                            <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Tujuan Distribusi Baru</label>
                            <select
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm font-semibold text-gray-800 cursor-pointer"
                                value={editItem.company}
                                onChange={e => setEditItem({ ...editItem, company: e.target.value })}
                            >
                                <option value="" disabled>Pilih Hotel Tujuan...</option>
                                {verifiedHotels.length > 0 ? verifiedHotels.map(hotel => (
                                    <option key={hotel.id} value={hotel.name}>{hotel.name}</option>
                                )) : (
                                    <option value="" disabled>Tidak ada hotel terverifikasi</option>
                                )}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Rekonsiliasi Status</label>
                            <select
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm font-semibold text-gray-800 cursor-pointer"
                                value={editItem.status}
                                onChange={(e) => {
                                    const status = e.target.value;
                                    if (isStatus(status)) {
                                        setEditItem({ ...editItem, status });
                                    }
                                }}
                            >
                                <option value="completed">Selesai</option>
                                <option value="cancelled">Di-Retur / Batal</option>
                            </select>
                        </div>
                        <div className="flex justify-end pt-5 space-x-3 border-t border-gray-100 mt-6">
                            <button type="button" className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors" onClick={() => setIsEditModalOpen(false)}>Batalkan</button>
                            <button type="submit" className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-blue-950 text-sm font-extrabold rounded-xl shadow-lg shadow-amber-500/30 transition-all active:scale-95">Setujui Perubahan</button>
                        </div>
                    </form>
                )}
            </Modal>

        </div>
    );
}

