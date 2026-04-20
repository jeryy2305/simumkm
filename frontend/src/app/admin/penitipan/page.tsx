"use client";

import { useState, useEffect } from "react";
import { Plus, Check, X, Search, Trash2, Edit, ClipboardList, MapPin, Package, Building2, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Modal } from "@/components/Modal";
import { API_URL, authFetch, parseJson } from "@/lib/auth";

export default function DataPenitipan() {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterOwner, setFilterOwner] = useState("");
    const [consignments, setConsignments] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [umkms, setUmkms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const activeUmkms = umkms.filter(u => u.status === 'active');
    const availableProducts = products.filter(p => p.status === 'available' && p.umkm?.status === 'active');

    // CRUD States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<any>(null);
    const [formData, setFormData] = useState({
        company: '',
        product_id: '',
        umkm_id: '',
        quantity: 0,
        duration_days: 0,
        start_date: '',
        status: 'active'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [consRes, prodRes, umkmRes] = await Promise.all([
                authFetch(`${API_URL}/api/consignments`),
                authFetch(`${API_URL}/api/products`),
                authFetch(`${API_URL}/api/umkms`)
            ]);

            if (!consRes.ok || !prodRes.ok || !umkmRes.ok) throw new Error('Failed to fetch data');

            setConsignments(await parseJson(consRes));
            setProducts(await parseJson(prodRes));
            setUmkms(await parseJson(umkmRes));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchConsignments = async () => {
        try {
            const response = await authFetch(`${API_URL}/api/consignments`);
            if (response.ok) {
                setConsignments(await parseJson(response));
            }
        } catch (err) { }
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
            quantity: 0, duration_days: 30, start_date: new Date().toISOString().split('T')[0], status: 'active'
        });
        setIsModalOpen(true);
    };

    const handleEditClick = (item: any) => {
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
                quantity: editItem.quantity,
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
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus arsip penitipan ini?")) return;
        try {
            const response = await authFetch(`${API_URL}/api/consignments/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Gagal menghapus data');
            setConsignments(consignments.filter(c => c.id !== id));
        } catch (err: any) {
            alert(err.message);
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
        } catch (err: any) {
            alert(err.message);
        }
    };

    // Auto-select UMKM based on Product
    const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const prodId = e.target.value;
        const selectedProd = products.find(p => p.id.toString() === prodId);
        setFormData({
            ...formData,
            product_id: prodId,
            umkm_id: selectedProd ? selectedProd.umkm_id.toString() : ''
        });
    };

    return (
        <div className="space-y-6 md:pb-24 font-sans text-gray-800">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-blue-950 mb-2">Administrasi Penitipan</h1>
                    <p className="text-gray-500 text-sm md:text-base">Pusat data lalu lintas penyaluran produk UMKM ke perhotelan.</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-blue-950 font-extrabold rounded-2xl shadow-lg shadow-amber-500/30 transition-all hover:-translate-y-0.5 active:scale-95 whitespace-nowrap cursor-pointer"
                >
                    <Plus size={20} /> Rekam Titipan Baru
                </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 bg-white px-2 py-1.5 rounded-3xl shadow-sm border border-gray-100 flex items-center focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-500 transition-all">
                    <div className="pl-4 pr-2">
                        <Search className="text-amber-500" size={22} />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari ID Titipan, Perusahaan Tujuan, atau Produk..."
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
                        {Array.from(new Set(activeUmkms.map(u => u.owner))).map(owner => (
                            <option key={owner as string} value={owner as string}>{owner as string}</option>
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
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Flow ID / Mitra</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Alokasi & Tujuan</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Kuantitas</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Siklus</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Kondisi Status</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100 text-right">Opsi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredData.map((item) => (
                                    <tr key={item.id} className="hover:bg-amber-50/30 transition-colors group">
                                        <td className="py-5 px-6">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded w-max mb-1.5 uppercase tracking-wider">TX-{item.id}</span>
                                                <span className="text-sm font-extrabold text-blue-950 group-hover:text-blue-700 transition-colors">{item.umkm?.owner || 'Tanpa Pemilik'}</span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2">
                                                    <Building2 size={14} className="text-blue-400" />
                                                    <span className="text-sm font-extrabold text-gray-800">{item.company || '-'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Package size={14} className="text-gray-400" />
                                                    <span className="text-xs font-semibold text-gray-600">{item.product?.name || 'Produk Unknown'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="inline-flex items-end text-blue-700">
                                                <span className="text-lg font-extrabold leading-none">{item.quantity}</span>
                                                <span className="text-[10px] font-bold ml-1 mb-0.5 uppercase tracking-widest text-blue-400">Unit</span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-gray-700">{new Date(item.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">({item.duration_days} Hari)</span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${item.status === 'active' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                item.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    'bg-red-50 text-red-700 border-red-200'
                                                }`}>
                                                {item.status === 'active' && <Clock size={12} className="shrink-0" />}
                                                {item.status === 'completed' && <CheckCircle2 size={12} className="shrink-0" />}
                                                {item.status === 'cancelled' && <XCircle size={12} className="shrink-0" />}
                                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                                    {item.status === "active" ? "Bergerak" : item.status === "completed" ? "Selesai" : "Retur"}
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
                                        <td colSpan={6} className="py-20 text-center">
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
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Delegasi Penitipan Baru">
                <form onSubmit={handleSubmit} className="space-y-5 px-1 py-2">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Pilih Objek Produk</label>
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
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Tujuan Distribusi (Instansi / Hotel)</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm font-semibold text-gray-800"
                            value={formData.company}
                            onChange={e => setFormData({ ...formData, company: e.target.value })}
                            placeholder="Contoh: Hotel Nagoya Batam..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Jumlah Unit (Pcs)</label>
                            <input
                                type="number"
                                required min="1"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm font-semibold text-gray-800"
                                value={formData.quantity}
                                onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Batas Hari</label>
                            <input
                                type="number"
                                required min="1"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm font-semibold text-gray-800"
                                value={formData.duration_days}
                                onChange={e => setFormData({ ...formData, duration_days: Number(e.target.value) })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Tanggal Berangkat</label>
                        <input
                            type="date"
                            required
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm font-semibold text-gray-800"
                            value={formData.start_date}
                            onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end pt-5 space-x-3 border-t border-gray-100 mt-6">
                        <button type="button" className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors" onClick={() => setIsModalOpen(false)}>Kembali</button>
                        <button type="submit" className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-blue-950 text-sm font-extrabold rounded-xl shadow-lg shadow-amber-500/30 transition-all active:scale-95">Simpan Catatan</button>
                    </div>
                </form>
            </Modal>

            {/* Edit Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Pembaruan Log Data">
                {editItem && (
                    <form onSubmit={handleEditSubmit} className="space-y-5 px-1 py-2">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Tujuan Distribusi Baru</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm font-semibold text-gray-800"
                                value={editItem.company}
                                onChange={e => setEditItem({ ...editItem, company: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Rekonsiliasi Status</label>
                            <select
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm font-semibold text-gray-800 cursor-pointer"
                                value={editItem.status}
                                onChange={(e) => setEditItem({ ...editItem, status: e.target.value })}
                            >
                                <option value="active">Bergerak Aktif</option>
                                <option value="completed">Selesai Berhasil</option>
                                <option value="cancelled">Di-Retur / Batal</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Revisi Jumlah (Pcs)</label>
                                <input
                                    type="number"
                                    required min="1"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm font-semibold text-gray-800"
                                    value={editItem.quantity}
                                    onChange={e => setEditItem({ ...editItem, quantity: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Kontrak (Hari)</label>
                                <input
                                    type="number"
                                    required min="1"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm font-semibold text-gray-800"
                                    value={editItem.duration_days}
                                    onChange={e => setEditItem({ ...editItem, duration_days: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Update Tanggal</label>
                            <input
                                type="date"
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm font-semibold text-gray-800"
                                value={editItem.start_date}
                                onChange={e => setEditItem({ ...editItem, start_date: e.target.value })}
                            />
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
