"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, CircleX, Edit, MapPin, Phone, Plus, Search, ShieldCheck, Trash2 } from "lucide-react";
import { Modal } from "@/components/Modal";
import Toast from "@/components/Toast";
import { API_URL, authFetch, parseJson } from "@/lib/auth";
import { HotelItem } from "@/lib/types";

const defaultForm = {
    name: "",
    city: "",
    address: "",
    phone: "",
    email: "",
    category: "3 Bintang",
    verified: false,
};

export default function HotelManagementPage() {
    const [hotels, setHotels] = useState<HotelItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<HotelItem | null>(null);
    const [formData, setFormData] = useState(defaultForm);
    const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

    const fetchHotels = async () => {
        try {
            setLoading(true);
            const response = await authFetch(`${API_URL}/api/hotels`);
            if (!response.ok) throw new Error("Gagal memuat data hotel");
            const data = await parseJson<HotelItem[]>(response);
            setHotels(data);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal memuat data hotel.";
            setNotification({ type: "error", message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHotels();
    }, []);

    useEffect(() => {
        if (!notification) return;
        const timer = window.setTimeout(() => setNotification(null), 4000);
        return () => window.clearTimeout(timer);
    }, [notification]);

    const filteredHotels = useMemo(
        () =>
            hotels.filter((hotel) => {
                const keyword = searchTerm.toLowerCase();
                return (
                    hotel.name.toLowerCase().includes(keyword) ||
                    hotel.city.toLowerCase().includes(keyword) ||
                    hotel.address.toLowerCase().includes(keyword) ||
                    hotel.phone.toLowerCase().includes(keyword)
                );
            }),
        [hotels, searchTerm],
    );

    const handleAdd = () => {
        setEditingItem(null);
        setFormData(defaultForm);
        setIsModalOpen(true);
    };

    const handleEdit = (hotel: HotelItem) => {
        setEditingItem(hotel);
        setFormData({
            name: hotel.name,
            city: hotel.city,
            address: hotel.address,
            phone: hotel.phone,
            email: hotel.email,
            category: hotel.category,
            verified: hotel.verified,
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus data hotel ini?")) return;

        try {
            const response = await authFetch(`${API_URL}/api/hotels/${id}`, { method: "DELETE" });
            if (!response.ok) throw new Error("Gagal menghapus hotel");
            setHotels((current) => current.filter((hotel) => hotel.id !== id));
            setNotification({ type: "success", message: "Hotel berhasil dihapus." });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal menghapus hotel.";
            setNotification({ type: "error", message });
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        const payload = {
            ...formData,
            name: formData.name.trim(),
            city: formData.city.trim(),
            address: formData.address.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim(),
        };

        if (!payload.name || !payload.city || !payload.address || !payload.phone || !payload.email) {
            setNotification({ type: "error", message: "Lengkapi semua data hotel sebelum disimpan." });
            return;
        }

        try {
            const url = editingItem ? `${API_URL}/api/hotels/${editingItem.id}` : `${API_URL}/api/hotels`;
            const method = editingItem ? "PUT" : "POST";
            const response = await authFetch(url, {
                method,
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                let errorMessage = "Gagal menyimpan data hotel";
                try {
                    const errorJson = await parseJson<{ message?: string }>(response);
                    errorMessage = errorJson?.message || errorMessage;
                } catch {
                    errorMessage = `Error ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const savedHotel = await parseJson<HotelItem>(response);
            setHotels((current) => {
                if (editingItem) {
                    return current.map((hotel) => (hotel.id === savedHotel.id ? savedHotel : hotel));
                }
                return [savedHotel, ...current];
            });

            setIsModalOpen(false);
            setEditingItem(null);
            setFormData(defaultForm);
            setNotification({
                type: "success",
                message: editingItem ? "Data hotel berhasil diperbarui." : "Hotel baru berhasil ditambahkan.",
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal menyimpan data hotel.";
            setNotification({ type: "error", message });
        }
    };

    const handleVerificationToggle = async (hotel: HotelItem) => {
        try {
            const response = await authFetch(`${API_URL}/api/hotels/${hotel.id}`, {
                method: "PUT",
                body: JSON.stringify({
                    ...hotel,
                    verified: !hotel.verified,
                }),
            });

            if (!response.ok) throw new Error("Gagal mengubah status verifikasi");

            const updatedHotel = await parseJson<HotelItem>(response);
            setHotels((current) => current.map((item) => (item.id === updatedHotel.id ? updatedHotel : item)));
            setNotification({
                type: "success",
                message: updatedHotel.verified
                    ? "Hotel berhasil diverifikasi dan dinyatakan ada."
                    : "Status hotel diubah menjadi belum diverifikasi.",
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal mengubah verifikasi hotel.";
            setNotification({ type: "error", message });
        }
    };

    return (
        <div className="space-y-6 pb-24 font-sans text-gray-800">
            {notification && <Toast type={notification.type} message={notification.message} onClose={() => setNotification(null)} />}

            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="mb-2 text-3xl font-extrabold text-blue-950">Data Hotel</h1>
                    <p className="text-gray-500">Verifikasi dan kelola data hotel agar tujuan distribusi benar-benar valid dan terdaftar dengan jelas.</p>
                </div>

                <button
                    type="button"
                    onClick={handleAdd}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-0.5 hover:bg-blue-700 active:scale-95"
                >
                    <Plus size={20} />
                    Tambah Hotel
                </button>
            </div>

            <div className="mb-6 flex items-center rounded-3xl border border-gray-100 bg-white p-2 shadow-sm focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20">
                <div className="px-4">
                    <Search className="text-blue-400" size={22} />
                </div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Cari hotel, kota, alamat, atau nomor telepon..."
                    className="w-full bg-transparent px-2 py-3 text-sm font-medium text-gray-800 outline-none"
                />
            </div>

            <div className="overflow-hidden rounded-4xl border border-gray-100 bg-white shadow-sm">
                {loading ? (
                    <div className="flex items-center justify-center p-16 text-blue-600">
                        <div className="text-center">
                            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                            <p className="font-semibold">Memuat data hotel...</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-gray-50/80">
                                    <th className="border-b border-gray-100 px-6 py-5 text-[10px] font-extrabold uppercase tracking-[0.15em] text-gray-500">No</th>
                                    <th className="border-b border-gray-100 px-6 py-5 text-[10px] font-extrabold uppercase tracking-[0.15em] text-gray-500">Nama Hotel</th>
                                    <th className="border-b border-gray-100 px-6 py-5 text-[10px] font-extrabold uppercase tracking-[0.15em] text-gray-500">Lokasi</th>
                                    <th className="border-b border-gray-100 px-6 py-5 text-[10px] font-extrabold uppercase tracking-[0.15em] text-gray-500">Kontak</th>
                                    <th className="border-b border-gray-100 px-6 py-5 text-[10px] font-extrabold uppercase tracking-[0.15em] text-gray-500">Kategori</th>
                                    <th className="border-b border-gray-100 px-6 py-5 text-[10px] font-extrabold uppercase tracking-[0.15em] text-gray-500">Verifikasi</th>
                                    <th className="border-b border-gray-100 px-6 py-5 text-right text-[10px] font-extrabold uppercase tracking-[0.15em] text-gray-500">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredHotels.map((hotel, index) => (
                                    <tr key={hotel.id} className="transition-colors hover:bg-blue-50/40">
                                        <td className="px-6 py-4 text-sm font-bold text-gray-400">{index + 1}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                                                    <Building2 size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-base font-extrabold text-gray-900">{hotel.name}</p>
                                                    <p className="text-xs text-gray-500">{hotel.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-2 text-sm text-gray-600">
                                                <MapPin size={14} className="mt-0.5 text-gray-400" />
                                                <span>{hotel.city}</span>
                                            </div>
                                            <p className="mt-2 max-w-xs text-xs text-gray-500">{hotel.address}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Phone size={14} className="text-gray-400" />
                                                <span>{hotel.phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700">{hotel.category}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                type="button"
                                                onClick={() => handleVerificationToggle(hotel)}
                                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                                                    hotel.verified
                                                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                                        : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                                }`}
                                            >
                                                {hotel.verified ? <ShieldCheck size={14} /> : <CircleX size={14} />}
                                                {hotel.verified ? "Terverifikasi" : "Belum Verifikasi"}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEdit(hotel)}
                                                    className="rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                                    aria-label={`Edit ${hotel.name}`}
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(hotel.id)}
                                                    className="rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                                                    aria-label={`Delete ${hotel.name}`}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredHotels.length === 0 && (
                            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                                <Building2 size={40} className="mb-3 text-gray-300" />
                                <p className="text-lg font-bold text-gray-700">Tidak ada data hotel yang cocok</p>
                                <p className="text-sm text-gray-500">Coba ubah kata kunci pencarian atau tambahkan hotel baru.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Edit Data Hotel" : "Tambah Hotel Baru"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-2 md:col-span-2">
                            <span className="text-xs font-bold uppercase tracking-[0.15em] text-gray-500">Nama Hotel</span>
                            <input
                                value={formData.name}
                                onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-600 focus:bg-white"
                                placeholder="Masukkan nama hotel"
                                required
                            />
                        </label>

                        <label className="space-y-2">
                            <span className="text-xs font-bold uppercase tracking-[0.15em] text-gray-500">Kota</span>
                            <input
                                value={formData.city}
                                onChange={(event) => setFormData((current) => ({ ...current, city: event.target.value }))}
                                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-600 focus:bg-white"
                                placeholder="Contoh: Batam"
                                required
                            />
                        </label>

                        <label className="space-y-2">
                            <span className="text-xs font-bold uppercase tracking-[0.15em] text-gray-500">Kategori</span>
                            <select
                                value={formData.category}
                                onChange={(event) => setFormData((current) => ({ ...current, category: event.target.value }))}
                                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-600 focus:bg-white"
                            >
                                <option value="2 Bintang">2 Bintang</option>
                                <option value="3 Bintang">3 Bintang</option>
                                <option value="4 Bintang">4 Bintang</option>
                                <option value="5 Bintang">5 Bintang</option>
                            </select>
                        </label>

                        <label className="space-y-2 md:col-span-2">
                            <span className="text-xs font-bold uppercase tracking-[0.15em] text-gray-500">Alamat</span>
                            <textarea
                                value={formData.address}
                                onChange={(event) => setFormData((current) => ({ ...current, address: event.target.value }))}
                                className="min-h-24 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-600 focus:bg-white"
                                placeholder="Alamat lengkap hotel"
                                required
                            />
                        </label>

                        <label className="space-y-2">
                            <span className="text-xs font-bold uppercase tracking-[0.15em] text-gray-500">Nomor Telepon</span>
                            <input
                                value={formData.phone}
                                onChange={(event) => setFormData((current) => ({ ...current, phone: event.target.value }))}
                                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-600 focus:bg-white"
                                placeholder="0812-xxxx-xxxx"
                                required
                            />
                        </label>

                        <label className="space-y-2">
                            <span className="text-xs font-bold uppercase tracking-[0.15em] text-gray-500">Email</span>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-600 focus:bg-white"
                                placeholder="hotel@example.com"
                                required
                            />
                        </label>
                    </div>

                    <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                        <input
                            type="checkbox"
                            checked={formData.verified}
                            onChange={(event) => setFormData((current) => ({ ...current, verified: event.target.checked }))}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Hotel sudah diverifikasi dan benar-benar ada</span>
                    </label>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-100"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                        >
                            {editingItem ? "Simpan Perubahan" : "Tambah Hotel"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
