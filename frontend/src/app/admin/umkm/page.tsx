"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, Store, ClipboardList } from "lucide-react";
import { Modal } from "@/components/Modal";
import Toast from "@/components/Toast";
import { API_URL, authFetch, parseJson } from "@/lib/auth";

export default function DataUMKM() {
    const [searchTerm, setSearchTerm] = useState("");
    const [umkms, setUmkms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

    // CRUD States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<any>(null);
    const [formData, setFormData] = useState({
        owner: '',
        phone: '',
        address: '',
        email: '',
        password: '',
        join_date: ''
    });

    useEffect(() => {
        fetchUmkms();
    }, []);

    useEffect(() => {
        if (!notification) return;
        const timer = window.setTimeout(() => setNotification(null), 4000);
        return () => window.clearTimeout(timer);
    }, [notification]);

    const fetchUmkms = async () => {
        try {
            const response = await authFetch(`${API_URL}/api/umkms`);
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await parseJson<any[]>(response);
            setUmkms(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = umkms.filter(item =>
        item.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.user?.email ? item.user.email.toLowerCase().includes(searchTerm.toLowerCase()) : false) || (item.address ? item.address.toLowerCase().includes(searchTerm.toLowerCase()) : false)
    );

    const handleAdd = () => {
        setEditItem(null);
        setFormData({
            owner: '',
            phone: '',
            address: '',
            email: '',
            password: '',
            join_date: new Date().toISOString().split('T')[0]
        });
        setIsModalOpen(true);
    };

    const handleEdit = (item: any) => {
        setEditItem(item);
        setFormData({
            owner: item.owner,
            phone: item.phone,
            address: item.address ?? '',
            email: item.user?.email ?? '',
            password: '',
            join_date: item.join_date
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus data UMKM ini? (Aksi ini tidak dapat dibatalkan)")) return;
        try {
            const response = await authFetch(`${API_URL}/api/umkms/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Gagal menghapus data');
            setUmkms(umkms.filter(u => u.id !== id));
            setNotification({ type: 'success', message: 'UMKM berhasil dihapus.' });
        } catch (err: any) {
            setNotification({ type: 'error', message: err.message });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = editItem ? 'PUT' : 'POST';
        const url = editItem ? `${API_URL}/api/umkms/${editItem.id}` : `${API_URL}/api/umkms`;
        const payload = { ...formData } as any;

        if (editItem && !formData.password) {
            delete payload.password;
        }

        try {
            const response = await authFetch(url, {
                method,
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                let errorMessage = 'Gagal menyimpan data';
                try {
                    const errorJson = await parseJson<{ message?: string }>(response);
                    errorMessage = errorJson?.message || errorMessage;
                } catch (parseError) {
                    errorMessage = `Error ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }
            const data = await parseJson<any>(response);
            if (editItem) {
                setUmkms(umkms.map(u => u.id === data.id ? data : u));
                setNotification({ type: 'success', message: 'UMKM berhasil diperbarui.' });
            } else {
                // place the new UMKM at the top
                setUmkms([data, ...umkms]);
                setNotification({ type: 'success', message: 'UMKM berhasil ditambahkan.' });
            }
            setIsModalOpen(false);
        } catch (err: any) {
            setNotification({ type: 'error', message: err.message });
        }
    };

    const handleStatusChange = async (id: number, newStatus: string) => {
        try {
            const response = await authFetch(`${API_URL}/api/umkms/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });
            if (!response.ok) {
                let errorMessage = 'Gagal mengupdate status';
                try {
                    const errorJson = await parseJson<{ message?: string }>(response);
                    errorMessage = errorJson?.message || errorMessage;
                } catch (parseError) {
                    errorMessage = `Error ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }
            setUmkms(umkms.map(u => u.id === id ? { ...u, status: newStatus } : u));
            setNotification({ type: 'success', message: 'Status UMKM berhasil diperbarui.' });
        } catch (err: any) {
            setNotification({ type: 'error', message: err.message });
        }
    };

    return (
        <div className="space-y-6 pb-24 font-sans text-gray-800">
            {notification && <Toast type={notification.type} message={notification.message} onClose={() => setNotification(null)} />}
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-blue-950 mb-2">Manajemen UMKM</h1>
                    <p className="text-gray-500">Kelola dan pantau seluruh data mitra UMKM yang tergabung dalam jaringan.</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                >
                    <Plus size={20} /> Tambah Mitra UMKM
                </button>
            </div>

            {/* Filter / Search Bar */}
            <div className="bg-white p-2 rounded-3xl shadow-sm border border-gray-100 flex items-center mb-6 focus-within:ring-2 focus-within:ring-blue-600/20 focus-within:border-blue-600 transition-all">
                <div className="pl-4 pr-2">
                    <Search className="text-blue-400" size={22} />
                </div>
                <input
                    type="text"
                    placeholder="Cari nama UMKM atau email pemilik..."
                    className="w-full bg-transparent px-2 py-3 outline-none text-sm font-medium text-gray-800"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-4xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-16 flex flex-col items-center justify-center text-blue-500">
                        <svg className="animate-spin h-8 w-8 mb-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="font-semibold">Memuat Data UMKM...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-red-500">Error: {error}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-gray-50/80">
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">ID</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Informasi Pemilik</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Alamat</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Kontak</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Bergabung</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Akses Status</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100 text-right">Manajemen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredData.map((item) => (
                                    <tr key={item.id} className="hover:bg-blue-50/40 transition-colors group">
                                        <td className="py-4 px-6 text-sm font-bold text-gray-400">#{item.id}</td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                                    <Store size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-extrabold text-gray-900 group-hover:text-blue-900 transition-colors">{item.owner}</p>
                                                    <p className="text-[11px] text-gray-500 font-medium">{item.user?.email ?? 'Tidak ada email'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm font-semibold text-gray-600 group-hover:text-amber-700 transition-colors">
                                            {item.address || '—'}
                                        </td>
                                        <td className="py-4 px-6 text-sm font-semibold text-gray-600 group-hover:text-amber-700 transition-colors">
                                            {item.phone}
                                        </td>
                                        <td className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-widest">
                                            {new Date(item.join_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="py-4 px-6">
                                            <select
                                                value={item.status}
                                                onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                                className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded-lg border focus:ring-2 focus:outline-none transition-all cursor-pointer ${item.status === "active"
                                                    ? "bg-green-50 text-green-700 border-green-200 focus:ring-green-500/20"
                                                    : "bg-red-50 text-red-700 border-red-200 focus:ring-red-500/20"
                                                    }`}
                                            >
                                                <option value="active">✓ Aktif</option>
                                                <option value="inactive">⚠ Non-Aktif</option>
                                            </select>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    className="p-2 rounded-xl text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white transition-all shadow-sm cursor-pointer"
                                                    onClick={() => handleEdit(item)}
                                                    title="Edit Data"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    className="p-2 rounded-xl text-red-600 bg-red-50 hover:bg-red-600 hover:text-white transition-all shadow-sm cursor-pointer"
                                                    onClick={() => handleDelete(item.id)}
                                                    title="Hapus MItra"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredData.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="py-16 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <ClipboardList size={40} className="text-gray-300 mb-4" />
                                                <p className="font-bold text-gray-700">Tidak Ada Data</p>
                                                <p className="text-sm mt-1">Data mitra UMKM tidak ditemukan.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editItem ? "Edit Profil Mitra UMKM" : "Registrasi Mitra UMKM Baru"}
            >
                <form onSubmit={handleSubmit} className="space-y-5 px-1 py-2">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Nama Pemilik / Eksekutor</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm font-semibold text-gray-800"
                            value={formData.owner}
                            onChange={e => setFormData({ ...formData, owner: e.target.value })}
                            placeholder="Contoh: Budi Santoso"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Alamat Email (Akun)</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm font-semibold text-gray-800"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="budi@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Alamat</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm font-semibold text-gray-800"
                            placeholder="Alamat lengkap (opsional)"
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Kata Sandi (Auth)</label>
                        <div className="relative">
                            <input
                                type={editItem ? 'password' : 'password'}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm font-semibold text-gray-800"
                                placeholder={editItem ? "Kosongkan jika tidak ingin mengubah password..." : "Minimal 8 karakter..."}
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                required={!editItem}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">No. WhatsApp</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm font-semibold text-gray-800"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="08123456"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Tanggal Mulai Mitra</label>
                            <input
                                type="date"
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm font-semibold text-gray-800"
                                value={formData.join_date}
                                onChange={e => setFormData({ ...formData, join_date: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end pt-5 space-x-3 border-t border-gray-100 mt-6">
                        <button
                            type="button"
                            className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Batalkan
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-95 cursor-pointer"
                        >
                            {editItem ? "Simpan Perubahan" : "Daftarkan UMKM"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
