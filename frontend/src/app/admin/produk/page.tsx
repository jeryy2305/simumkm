"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Edit, Trash2, Search, PackageOpen, Tag, Store, AlertTriangle, Lock } from "lucide-react";
import { Modal } from "@/components/Modal";
import Toast from "@/components/Toast";
import { API_URL, authFetch, parseJson } from "@/lib/auth";

export default function DataProduk() {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterOwner, setFilterOwner] = useState("");
    const [products, setProducts] = useState<any[]>([]);
    const [umkmsList, setUmkmsList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

    const activeUmkms = umkmsList.filter(u => u.status === 'active');

    // CRUD States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        category: 'Makanan',
        price: 0,
        quantity: 0,
        status: 'available',
        umkm_id: '' as string | number
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [formTouched, setFormTouched] = useState<Record<string, boolean>>({});

    const validateForm = useCallback((data: typeof formData): Record<string, string> => {
        const errors: Record<string, string> = {};
        if (!data.name || data.name.trim() === '') {
            errors.name = 'Nama produk wajib diisi.';
        }
        if (!data.category || data.category.trim() === '') {
            errors.category = 'Kategori wajib dipilih.';
        }
        if (!data.price || Number(data.price) <= 0) {
            errors.price = 'Harga harus lebih dari 0.';
        }
        if (data.quantity === undefined || data.quantity === null || Number(data.quantity) <= 0) {
            errors.quantity = 'Kuantitas harus lebih dari 0.';
        }
        if (!data.umkm_id || data.umkm_id === '') {
            errors.umkm_id = 'Pemilik UMKM wajib dipilih.';
        }
        return errors;
    }, []);

    const isFormValid = useMemo(() => {
        const errors = validateForm(formData);
        return Object.keys(errors).length === 0;
    }, [formData, validateForm]);

    const handleFieldBlur = (field: string) => {
        setFormTouched(prev => ({ ...prev, [field]: true }));
        const errors = validateForm(formData);
        setFormErrors(prev => {
            const updated = { ...prev };
            if (errors[field]) {
                updated[field] = errors[field];
            } else {
                delete updated[field];
            }
            return updated;
        });
    };

    const handleFieldChange = (field: string, value: string | number) => {
        const newFormData = { ...formData, [field]: value };
        setFormData(newFormData);
        // Clear error for this field immediately on change if it was touched
        if (formTouched[field]) {
            const errors = validateForm(newFormData);
            setFormErrors(prev => {
                const updated = { ...prev };
                if (errors[field]) {
                    updated[field] = errors[field];
                } else {
                    delete updated[field];
                }
                return updated;
            });
        }
    };

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
            const [prodRes, umkmRes] = await Promise.all([
                authFetch(`${API_URL}/api/products`),
                authFetch(`${API_URL}/api/umkms`)
            ]);

            if (!prodRes.ok || !umkmRes.ok) throw new Error('Failed to fetch data');

            const productsData = await parseJson<any[]>(prodRes);
            setProducts(productsData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
            setUmkmsList(await parseJson<any[]>(umkmRes));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await authFetch(`${API_URL}/api/products`);
            if (response.ok) {
                const data = await parseJson<any[]>(response);
                setProducts(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
            }
        } catch (err) { }
    }

    const filteredData = products.filter(item => {
        const isActiveUmkm = item.umkm?.status === "active";
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.umkm?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesOwner = filterOwner === "" || (item.umkm && item.umkm.owner === filterOwner);
        return isActiveUmkm && matchesSearch && matchesOwner;
    });

    const handleAdd = () => {
        setEditItem(null);
        setFormData({
            name: '',
            category: 'Makanan',
            price: 0,
            quantity: 0,
            status: 'available',
            umkm_id: ''
        });
        setFormErrors({});
        setFormTouched({});
        setIsModalOpen(true);
    };

    const handleEdit = (item: any) => {
        setEditItem(item);
        setFormData({
            name: item.name,
            category: item.category,
            price: item.price,
            quantity: item.quantity ?? 0,
            status: item.status,
            umkm_id: item.umkm_id
        });
        setFormErrors({});
        setFormTouched({});
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;
        try {
            const response = await authFetch(`${API_URL}/api/products/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                let errorMessage = 'Gagal menghapus data';
                try {
                    const errorJson = await parseJson<{ message?: string }>(response);
                    errorMessage = errorJson?.message || errorMessage;
                } catch (parseError) {
                    errorMessage = `Error ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }
            setProducts(products.filter(p => p.id !== id));
            setNotification({ type: 'success', message: 'Produk berhasil dihapus.' });
        } catch (err: any) {
            setNotification({ type: 'error', message: err.message });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Mark all fields as touched so errors show up
        const allTouched: Record<string, boolean> = {
            name: true, category: true, price: true, quantity: true, umkm_id: true
        };
        setFormTouched(allTouched);

        // Run full validation
        const errors = validateForm(formData);
        setFormErrors(errors);

        if (Object.keys(errors).length > 0) {
            setNotification({ type: 'error', message: 'Harap lengkapi semua field sebelum menyimpan produk.' });
            return;
        }

        const method = editItem ? 'PUT' : 'POST';
        const url = editItem ? `${API_URL}/api/products/${editItem.id}` : `${API_URL}/api/products`;
        try {
            const response = await authFetch(url, {
                method,
                body: JSON.stringify(formData)
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

            await fetchProducts(); // Re-fetch to get relationships populated
            setIsModalOpen(false);
            setNotification({ type: 'success', message: editItem ? 'Produk berhasil diperbarui.' : 'Produk berhasil ditambahkan.' });
        } catch (err: any) {
            setNotification({ type: 'error', message: err.message });
        }
    };

    return (
        <div className="space-y-6 md:pb-24 font-sans text-gray-800">
            {notification && <Toast type={notification.type} message={notification.message} onClose={() => setNotification(null)} />}
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-blue-950 mb-2">Katalog Produk UMKM</h1>
                    <p className="text-gray-500 text-sm md:text-base">Kelola seluruh direktori data produk yang dikelola oleh mitra UMKM.</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-0.5 active:scale-95 whitespace-nowrap cursor-pointer"
                >
                    <Plus size={20} /> Tambah Produk
                </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 bg-white px-2 py-1.5 rounded-3xl shadow-sm border border-gray-100 flex items-center focus-within:ring-2 focus-within:ring-blue-600/20 focus-within:border-blue-600 transition-all">
                    <div className="pl-4 pr-2">
                        <Search className="text-blue-400" size={22} />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari nama produk, umkm, atau kategori..."
                        className="w-full bg-transparent px-2 py-3 outline-none text-sm font-medium text-gray-800"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-72 shrink-0 bg-white p-2 rounded-3xl shadow-sm border border-gray-100">
                    <select
                        className="w-full px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-50/80 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-600/20 transition-all cursor-pointer"
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

            {/* Table Container */}
            <div className="bg-white rounded-4xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="relative h-64 flex items-center justify-center text-blue-600 flex-col gap-4">
                        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        <p className="font-bold text-sm tracking-widest uppercase">Memuat Katalog...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-red-500 font-bold bg-red-50">Error: {error}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-gray-50/80">
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">ID Produk</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Info Produk</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Pemilik (UMKM)</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Kategori</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100 text-center">Kuantitas</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100 text-right">Manajemen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredData.map((item) => (
                                    <tr key={item.id} className={`transition-colors group ${item.has_completed_consignment ? 'bg-gray-50/60' : 'hover:bg-blue-50/40'}`}>
                                        <td className="py-4 px-6 text-sm font-bold text-gray-400">#{item.id}</td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <span className={`text-sm font-extrabold transition-colors ${item.has_completed_consignment ? 'text-gray-500' : 'text-gray-900 group-hover:text-amber-600'}`}>{item.name}</span>
                                                <span className="text-xs font-bold text-blue-600 mt-0.5">Rp {Number(item.price).toLocaleString('id-ID')}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <Store size={14} className="text-amber-500" />
                                                <span className="text-sm font-semibold text-gray-800">{item.umkm?.owner || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[11px] font-bold uppercase tracking-wider">
                                                <Tag size={12} /> {item.category}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg text-xs font-extrabold bg-blue-50 text-blue-950 border border-blue-100">
                                                {item.quantity ?? 0} unit
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex justify-end space-x-2">
                                                {item.has_completed_consignment ? (
                                                    <div
                                                        className="p-2 rounded-xl text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed"
                                                        title="Produk terkunci — penitipan sudah berstatus Keluar"
                                                    >
                                                        <Lock size={16} />
                                                    </div>
                                                ) : (
                                                    <button
                                                        className="p-2 rounded-xl text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white transition-all shadow-sm cursor-pointer"
                                                        onClick={() => handleEdit(item)}
                                                        title="Edit Produk"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    className="p-2 rounded-xl text-red-600 bg-red-50 hover:bg-red-600 hover:text-white transition-all shadow-sm cursor-pointer"
                                                    onClick={() => handleDelete(item.id)}
                                                    title="Hapus Produk"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredData.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <PackageOpen size={40} className="text-gray-300 mb-4" />
                                                <p className="font-bold text-gray-700">Produk Tidak Ditemukan</p>
                                                <p className="text-sm mt-1">Belum ada produk yang terklasifikasi dalam data.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Form */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editItem ? "Edit Spesifikasi Produk" : "Tambah Entri Produk Baru"}
            >
                <form onSubmit={handleSubmit} className="space-y-5 px-1 py-2" noValidate>
                    {/* Nama Produk */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Nama Produk Dagang <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 outline-none transition-all text-sm font-semibold text-gray-800 ${
                                formTouched.name && formErrors.name
                                    ? 'border-red-400 focus:ring-red-200/50 focus:border-red-500'
                                    : 'border-gray-200 focus:ring-blue-600/20 focus:border-blue-600'
                            }`}
                            value={formData.name}
                            onChange={e => handleFieldChange('name', e.target.value)}
                            onBlur={() => handleFieldBlur('name')}
                            placeholder="Contoh: Keripik Singkong Balado..."
                        />
                        {formTouched.name && formErrors.name && (
                            <p className="mt-1.5 text-xs font-semibold text-red-500 flex items-center gap-1">
                                <AlertTriangle size={12} /> {formErrors.name}
                            </p>
                        )}
                    </div>

                    {/* Kategori, Harga, Kuantitas */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Kategori <span className="text-red-500">*</span></label>
                            <select
                                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 outline-none transition-all text-sm font-semibold text-gray-800 cursor-pointer ${
                                    formTouched.category && formErrors.category
                                        ? 'border-red-400 focus:ring-red-200/50 focus:border-red-500'
                                        : 'border-gray-200 focus:ring-blue-600/20 focus:border-blue-600'
                                }`}
                                value={formData.category}
                                onChange={e => handleFieldChange('category', e.target.value)}
                                onBlur={() => handleFieldBlur('category')}
                            >
                                <option value="Makanan">Makanan</option>
                                <option value="Minuman">Minuman</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
                            {formTouched.category && formErrors.category && (
                                <p className="mt-1.5 text-xs font-semibold text-red-500 flex items-center gap-1">
                                    <AlertTriangle size={12} /> {formErrors.category}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Harga Produk (Rp) <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                min="1"
                                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 outline-none transition-all text-sm font-semibold text-gray-800 ${
                                    formTouched.price && formErrors.price
                                        ? 'border-red-400 focus:ring-red-200/50 focus:border-red-500'
                                        : 'border-gray-200 focus:ring-blue-600/20 focus:border-blue-600'
                                }`}
                                value={formData.price || ''}
                                onChange={e => handleFieldChange('price', Number(e.target.value))}
                                onBlur={() => handleFieldBlur('price')}
                                placeholder="Masukkan harga produk"
                            />
                            {formTouched.price && formErrors.price && (
                                <p className="mt-1.5 text-xs font-semibold text-red-500 flex items-center gap-1">
                                    <AlertTriangle size={12} /> {formErrors.price}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Kuantitas (Unit) <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                min="1"
                                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 outline-none transition-all text-sm font-semibold text-gray-800 ${
                                    formTouched.quantity && formErrors.quantity
                                        ? 'border-red-400 focus:ring-red-200/50 focus:border-red-500'
                                        : 'border-gray-200 focus:ring-blue-600/20 focus:border-blue-600'
                                }`}
                                value={formData.quantity || ''}
                                onChange={e => handleFieldChange('quantity', Number(e.target.value))}
                                onBlur={() => handleFieldBlur('quantity')}
                                placeholder="Masukkan jumlah unit"
                            />
                            {formTouched.quantity && formErrors.quantity && (
                                <p className="mt-1.5 text-xs font-semibold text-red-500 flex items-center gap-1">
                                    <AlertTriangle size={12} /> {formErrors.quantity}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Pemilik UMKM */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Pemilik UMKM <span className="text-red-500">*</span></label>
                        <select
                            className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 outline-none transition-all text-sm font-semibold text-gray-800 cursor-pointer ${
                                formTouched.umkm_id && formErrors.umkm_id
                                    ? 'border-red-400 focus:ring-red-200/50 focus:border-red-500'
                                    : 'border-gray-200 focus:ring-blue-600/20 focus:border-blue-600'
                            }`}
                            value={formData.umkm_id}
                            onChange={e => handleFieldChange('umkm_id', Number(e.target.value))}
                            onBlur={() => handleFieldBlur('umkm_id')}
                        >
                            <option value="" disabled>-- Pilih Entitas Mitra --</option>
                            {activeUmkms.map(umkm => (
                                <option key={umkm.id} value={umkm.id}>{umkm.owner}</option>
                            ))}
                        </select>
                        {formTouched.umkm_id && formErrors.umkm_id && (
                            <p className="mt-1.5 text-xs font-semibold text-red-500 flex items-center gap-1">
                                <AlertTriangle size={12} /> {formErrors.umkm_id}
                            </p>
                        )}
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex flex-col gap-3 pt-5 border-t border-gray-100 mt-6">
                        {!isFormValid && Object.keys(formTouched).length > 0 && (
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl">
                                <AlertTriangle size={16} className="text-red-500 shrink-0" />
                                <p className="text-xs font-semibold text-red-600">Semua field bertanda <span className="text-red-500">*</span> wajib diisi dengan benar sebelum menyimpan.</p>
                            </div>
                        )}
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Batalkan
                            </button>
                            <button
                                type="submit"
                                disabled={!isFormValid}
                                className={`px-6 py-2.5 text-sm font-bold rounded-xl shadow-lg transition-all active:scale-95 ${
                                    isFormValid
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30 cursor-pointer'
                                        : 'bg-gray-300 text-gray-500 shadow-none cursor-not-allowed'
                                }`}
                            >
                                {editItem ? "Simpan Revisi" : "Tambahkan Baru"}
                            </button>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
