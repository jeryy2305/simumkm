"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Search, Package, Tag, CheckCircle2, AlertCircle, History, ChevronRight, ArrowLeft, Calendar, Clock, Activity } from "lucide-react";
import { API_URL, authFetch, parseJson } from "@/lib/auth";
import Toast from "@/components/Toast";
import { Modal } from "@/components/Modal";
import FloatingWhatsAppButton from "@/components/FloatingWhatsAppButton";

interface ProductRequest {
  id: number;
  name: string;
  category: string;
  quantity: number;
  reference_price: number | null;
  price_offered: number | null;
  hotel_departure_date?: string | null;
  purpose?: string | null;
  status: "open" | "pending_approval" | "taken" | "completed" | "cancelled" | "expired" | "fulfilled" | "unfulfilled";
  taken_by_umkm?: { id: number; owner: string; name?: string } | null;
  created_at?: string;
  updated_at?: string;
  offer_status?: "pending" | "approved" | "rejected";
  offers?: Array<{ id: number; price_offered: number; quantity_offered?: number | null; status: string }>;
  participation_deadline?: string | null;
  approval_notice?: string | null;
}

interface RequestHistoryItem {
  title: string;
  description: string;
  timestamp?: string;
}

interface RequestHistoryResponse {
  request: ProductRequest;
  history: RequestHistoryItem[];
  status_label?: string;
}

type HistoryListResponse = HistoryListItem[];

interface Notification {
  type: "success" | "error" | "info";
  message: string;
}

interface HistoryListItem extends ProductRequest {
  history_status?: string;
  history_sort_at?: string;
}

export default function RequestProdukUMKM() {
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ProductRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState<RequestHistoryResponse | null>(null);
  const [historyList, setHistoryList] = useState<HistoryListItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const sortRequestsNewestFirst = (items: ProductRequest[]) => {
    return [...items].sort((a, b) => b.id - a.id);
  };

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authFetch(`${API_URL}/api/umkm-user/product-requests`);
      if (!response.ok) {
        throw new Error("Gagal memuat request produk");
      }
      const data = await parseJson<ProductRequest[]>(response);
      setRequests(sortRequestsNewestFirst(data));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat request produk");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();

    const intervalId = window.setInterval(() => {
      void fetchRequests();
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [fetchRequests]);

  const focusRequest = useCallback((requestId: string) => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const primaryId = isMobile ? `request-mobile-${requestId}` : `request-${requestId}`;
    const fallbackId = isMobile ? `request-${requestId}` : `request-mobile-${requestId}`;
    const element = document.getElementById(primaryId) || document.getElementById(fallbackId);

    if (element) {
      window.setTimeout(() => {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.classList.add("bg-amber-100/50", "transition-all", "duration-1000");
        window.setTimeout(() => element.classList.remove("bg-amber-100/50"), 3000);
      }, 150);
    }
  }, []);

  useEffect(() => {
    if (!notification) return;
    const timer = window.setTimeout(() => setNotification(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notification]);

  useEffect(() => {
    if (loading || requests.length === 0) return;

    // Retrieve requested product request ID from query params or URL hash
    const urlParams = new URLSearchParams(window.location.search);
    let requestId = urlParams.get("id");

    if (!requestId) {
      const hash = window.location.hash;
      if (hash && hash.startsWith("#request-")) {
        requestId = hash.replace("#request-", "");
      }
    }

    if (requestId) {
      focusRequest(requestId);
    }
  }, [focusRequest, loading, requests]);

  useEffect(() => {
    const handleRequestFocus = (event: Event) => {
      const requestId = (event as CustomEvent<string>).detail;
      if (!loading && requests.length > 0 && requestId) focusRequest(requestId);
    };

    window.addEventListener("product-request-focus", handleRequestFocus);
    return () => window.removeEventListener("product-request-focus", handleRequestFocus);
  }, [focusRequest, loading, requests]);

  const openTakeModal = (request: ProductRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
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
    if (!value) return "Belum ditentukan";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(date);
  };

  const formatDepartureTime = (value?: string | null) => value ? `${value.slice(0, 5)} WIB` : "Belum ditentukan";

  const getHistoryStatusLabel = (status?: string) => {
    switch (status) {
      case "Menunggu Persetujuan":
        return "Menunggu Tester";
      case "Masuk ke Mitra":
      case "Terpenuhi":
        return "Terpenuhi";
      case "Ditolak":
        return "Ditolak";
      case "Dalam Penyaluran":
        return "Dalam Penyaluran";
      case "Selesai Dititip":
        return "Selesai Dititip";
      case "Sudah Diantar":
        return "Sudah Diantar";
      case "Retur":
        return "Retur";
      case "Terbuka":
        return "Terbuka";
      default:
        return "Sedang Ditinjau";
    }
  };

  const getHistoryStatusClasses = (status?: string) => {
    switch (status) {
      case "Menunggu Persetujuan":
        return "bg-slate-200 text-slate-700";
      case "Masuk ke Mitra":
        return "bg-blue-100 text-blue-700";
      case "Ditolak":
        return "bg-rose-100 text-rose-700";
      case "Dalam Penyaluran":
        return "bg-amber-100 text-amber-700";
      case "Selesai Dititip":
        return "bg-emerald-100 text-emerald-700";
      case "Sudah Diantar":
        return "bg-blue-100 text-blue-700";
      case "Retur":
        return "bg-rose-100 text-rose-700";
      case "Terbuka":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-amber-100 text-amber-700";
    }
  };

  const getOfferStatusLabel = (status?: string) => {
    switch (status) {
      case "approved":
        return "Disetujui";
      case "rejected":
        return "Ditolak";
      default:
        return "Menunggu Tester";
    }
  };

  const getOfferStatusClasses = (status?: string) => {
    switch (status) {
      case "approved":
        return "bg-emerald-100 text-emerald-700";
      case "rejected":
        return "bg-rose-100 text-rose-700";
      default:
        return "bg-amber-100 text-amber-700";
    }
  };

  const openHistoryModal = async (request?: ProductRequest) => {
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    setHistoryError(null);
    setHistoryData(null);

    try {
      if (request) {
        const response = await authFetch(`${API_URL}/api/umkm-user/product-requests/${request.id}/history`);
        if (!response.ok) {
          throw new Error("Gagal memuat riwayat request");
        }
        const data = await parseJson<RequestHistoryResponse>(response);
        setHistoryData(data);
        return;
      }

      const response = await authFetch(`${API_URL}/api/umkm-user/product-requests/history`);
      if (!response.ok) {
        throw new Error("Gagal memuat history permintaan");
      }
      const data = await parseJson<HistoryListResponse>(response);
      setHistoryList([...data].sort((a, b) => {
        const dateA = new Date(a.history_sort_at || a.updated_at || a.created_at || 0).getTime();
        const dateB = new Date(b.history_sort_at || b.updated_at || b.created_at || 0).getTime();
        return dateB - dateA || b.id - a.id;
      }));
    } catch (err: unknown) {
      setHistoryError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat history request");
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeHistoryModal = () => {
    setIsHistoryModalOpen(false);
    setHistoryData(null);
    setHistoryList([]);
    setHistoryError(null);
  };

  const handleTakeRequest = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      const response = await authFetch(`${API_URL}/api/umkm-user/product-requests/${selectedRequest.id}/take`, {
        method: "POST",
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        let message = "Gagal mengambil request";
        try {
          const json = await parseJson<{ message?: string }>(response);
          message = json.message || message;
        } catch {
          message = `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(message);
      }

      const result = await parseJson<{ request: ProductRequest }>(response);
      setRequests((prev) => prev.map((item) => (item.id === result.request.id ? { ...result.request, offer_status: "pending" } : item)));
      window.dispatchEvent(new Event("product-request-status-changed"));
      setNotification({ type: "success", message: "Anda berhasil terdaftar sebagai peserta tester." });
      setIsModalOpen(false);
      setIsConfirmationOpen(false);
      setSelectedRequest(null);
    } catch (err: unknown) {
      setNotification({ type: "error", message: err instanceof Error ? err.message : "Terjadi kesalahan saat mengambil request" });
    }
  };

  const filteredRequests = useMemo(() => {
    const now = Date.now();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    return requests.filter((item) => {
      const isNonAktif = item.status === "fulfilled" || item.status === "expired" || item.status === "unfulfilled";
      if (isNonAktif) {
        const itemTime = new Date(item.updated_at || item.created_at || Date.now()).getTime();
        if (now - itemTime > TWENTY_FOUR_HOURS) {
          return false;
        }
      }

      const term = searchTerm.toLowerCase();
      const statusLabelMap: Record<string, string> = {
        open: "terbuka",
        pending_approval: "menunggu tester",
        expired: "kedaluwarsa",
        fulfilled: "terpenuhi",
        unfulfilled: "tidak terpenuhi",
        taken: "sudah diambil",
        completed: "selesai"
      };
      const statusLabel = statusLabelMap[item.status] || "";

      return (
        item.name.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
        item.purpose?.toLowerCase().includes(term) ||
        item.status.toLowerCase().includes(term) ||
        statusLabel.includes(term)
      );
    });
  }, [requests, searchTerm]);

  return (
    <div className="space-y-6 pb-24 font-sans text-gray-800">
      {notification && <Toast type={notification.type} message={notification.message} onClose={() => setNotification(null)} />}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-950 mb-2">Permintaan Produk</h1>
          <p className="text-gray-500 text-sm md:text-base">Lihat request produk dari admin, tawarkan harga, dan hasilkan produk baru secara otomatis.</p>
        </div>
        <button
          type="button"
          onClick={() => void openHistoryModal()}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-200 active:scale-95"
        >
          <History size={16} /> History Permintaan
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 bg-white px-2 py-1.5 rounded-3xl shadow-sm border border-gray-100 flex items-center focus-within:ring-2 focus-within:ring-blue-600/20 focus-within:border-blue-600 transition-all">
          <div className="pl-4 pr-2">
            <Search className="text-blue-400" size={22} />
          </div>
          <input
            type="text"
            placeholder="Cari request nama, kategori, atau status..."
            className="w-full bg-transparent px-2 py-3 outline-none text-sm font-medium text-gray-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-4xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="relative h-64 flex items-center justify-center text-blue-600 flex-col gap-4">
            <p className="font-bold text-sm tracking-widest uppercase">Memuat Request...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 font-bold bg-red-50">Error: {error}</div>
        ) : (
          <>
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Request</th>
                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Kategori</th>
                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100 text-center">Stok yang Dibutuhkan</th>
                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Status</th>
                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredRequests.map((item) => (
                    <tr key={item.id} id={`request-${item.id}`} className={`transition-colors group ${item.status === 'pending_approval' || item.status === 'expired' || item.status === 'unfulfilled' || item.status === 'fulfilled' ? 'bg-gray-100 opacity-60' : 'hover:bg-blue-50/40'}`}>
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
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${item.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                          {item.status === 'open' ? 'Terbuka' : item.status === 'pending_approval' ? 'Menunggu Tester' : item.status === 'expired' ? 'Kedaluwarsa' : item.status === 'fulfilled' ? 'Terpenuhi' : item.status === 'unfulfilled' ? 'Tidak Terpenuhi' : 'Sudah Diambil'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {item.status === 'expired' || item.status === 'unfulfilled' || item.status === 'fulfilled' ? (
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gray-100 text-gray-400 text-sm font-semibold">
                            <AlertCircle size={16} /> {item.status === 'expired' ? 'Request Kedaluwarsa' : item.status === 'fulfilled' ? 'Request Terpenuhi' : 'Request Tidak Terpenuhi'}
                          </div>
                        ) : item.offer_status === 'pending' ? (
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-100 text-amber-800 text-sm font-semibold">
                            <AlertCircle size={16} /> Antar tester ke mitra pada {formatDepartureDate(item.hotel_departure_date)}
                          </div>
                        ) : item.offer_status === 'approved' ? (
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-100 text-emerald-800 text-sm font-semibold">
                            <CheckCircle2 size={16} /> Disetujui
                          </div>
                        ) : item.status === 'open' ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all active:scale-95"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              openTakeModal(item);
                            }}
                          >
                            <Package size={16} /> Ambil Request
                          </button>
                        ) : item.status === 'pending_approval' ? (
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gray-200 text-gray-600 text-sm font-semibold">
                            <AlertCircle size={16} /> Menunggu Tester
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100 text-slate-700 text-sm font-semibold">
                            <CheckCircle2 size={16} /> Sudah Diambil
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredRequests.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <AlertCircle size={40} className="text-gray-300" />
                          <p className="font-bold text-gray-700">Tidak ada request produk tersedia.</p>
                          <p className="text-sm text-gray-500">Tunggu admin membuat request baru atau coba lagi nanti.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-4 px-4 py-5">
              {filteredRequests.length > 0 ? (
                filteredRequests.map((item) => (
                  <article key={item.id} id={`request-mobile-${item.id}`} className={`rounded-4xl border border-gray-100 p-4 shadow-sm ${item.status === 'pending_approval' || item.status === 'expired' || item.status === 'unfulfilled' || item.status === 'fulfilled' ? 'bg-gray-200 opacity-60' : 'bg-slate-50'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-extrabold text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{item.category}</p>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${item.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                        {item.status === 'open' ? 'Terbuka' : item.status === 'pending_approval' ? 'Menunggu Tester' : item.status === 'expired' ? 'Kedaluwarsa' : item.status === 'fulfilled' ? 'Terpenuhi' : item.status === 'unfulfilled' ? 'Tidak Terpenuhi' : 'Sudah Diambil'}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-gray-700">
                      <div className="flex items-center justify-between gap-2 rounded-3xl bg-white px-4 py-3 shadow-sm border border-gray-100">
                        <span className="text-slate-500">Stok yang Dibutuhkan</span>
                        <span className="font-semibold">{item.quantity}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 rounded-3xl bg-white px-4 py-3 shadow-sm border border-gray-100">
                        <span className="text-slate-500">Harga Produk</span>
                        <span className="font-semibold">
                          {item.reference_price !== null && item.reference_price !== undefined
                            ? `Rp ${Number(item.reference_price).toLocaleString("id-ID")}`
                            : "—"}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-3xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">Pengantaran Tester</p>
                          <p className="mt-1 font-bold text-blue-950">{formatDepartureDate(item.hotel_departure_date)}</p>
                        </div>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-gray-500 line-clamp-3">{item.purpose || 'Tidak ada tujuan'}</p>

                    <div className="mt-4 flex justify-end">
                      {item.status === 'expired' || item.status === 'unfulfilled' || item.status === 'fulfilled' ? (
                        <div className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-400">
                          <AlertCircle size={16} /> {item.status === 'expired' ? 'Request Kedaluwarsa' : item.status === 'fulfilled' ? 'Request Terpenuhi' : 'Request Tidak Terpenuhi'}
                        </div>
                      ) : item.offer_status === 'pending' ? (
                        <div className="w-full rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                          <div className="flex items-start gap-2">
                            <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                            <span>Produk tester wajib Anda antar ke mitra pada tanggal <strong>{formatDepartureDate(item.hotel_departure_date)}</strong>.</span>
                          </div>
                        </div>
                      ) : item.offer_status === 'approved' ? (
                        <div className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-800">
                          <CheckCircle2 size={16} /> Peserta disetujui
                        </div>
                      ) : item.status === 'open' ? (
                        <button
                          type="button"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-95"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            openTakeModal(item);
                          }}
                        >
                          <Package size={16} /> Ambil Request
                        </button>
                      ) : item.status === 'pending_approval' ? (
                        <div className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-300 px-4 py-3 text-sm font-semibold text-gray-600">
                          <AlertCircle size={16} /> Menunggu Tester
                        </div>
                      ) : (
                        <div className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
                          <CheckCircle2 size={16} /> Sudah Diambil
                        </div>
                      )}
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-4xl border border-gray-100 bg-slate-50 p-8 text-center text-gray-500">
                  <AlertCircle size={40} className="mx-auto mb-4 text-gray-300" />
                  <p className="font-bold text-gray-700">Tidak ada request produk tersedia.</p>
                  <p className="text-sm text-gray-500">Tunggu admin membuat request baru atau coba lagi nanti.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Modal isOpen={isHistoryModalOpen} onClose={closeHistoryModal} title="History Permintaan">
        {historyLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-blue-600">
            <span className="mt-3 text-sm font-bold text-gray-600">Memuat history request...</span>
          </div>
        ) : historyError ? (
          <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600 border border-red-100 flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{historyError}</span>
          </div>
        ) : historyData ? (
          <div className="space-y-4">
            {historyList.length > 0 && (
              <button
                type="button"
                onClick={() => setHistoryData(null)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} /> Kembali ke Daftar History
              </button>
            )}

            <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-blue-50/90 p-4 sm:p-5 shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-blue-600/10 text-[10px] font-extrabold uppercase tracking-widest text-blue-700">
                    Request
                  </span>
                  <h3 className="mt-1 text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">{historyData.request.name}</h3>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-2xs ${getOfferStatusClasses(historyData.request.offer_status)}`}>
                  {getOfferStatusLabel(historyData.request.offer_status)}
                </span>
              </div>
            </div>

            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
              <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-3.5 sm:p-4 transition-all hover:bg-white hover:border-gray-200 hover:shadow-xs">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100/70 text-blue-600">
                    <Package size={15} />
                  </div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">Jumlah</p>
                </div>
                <p className="text-base font-extrabold text-gray-900 pl-0.5">{historyData.request.quantity} <span className="text-xs font-medium text-gray-500">unit</span></p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-3.5 sm:p-4 transition-all hover:bg-white hover:border-gray-200 hover:shadow-xs">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100/70 text-emerald-600">
                    <Tag size={15} />
                  </div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">Harga Produk</p>
                </div>
                <p className="text-base font-extrabold text-gray-900 pl-0.5">
                  {historyData.request.reference_price !== null && historyData.request.reference_price !== undefined
                    ? `Rp ${Number(historyData.request.reference_price).toLocaleString("id-ID")}`
                    : "—"}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-3.5 sm:p-4 transition-all hover:bg-white hover:border-gray-200 hover:shadow-xs">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100/70 text-amber-600">
                    <Calendar size={15} />
                  </div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">Tanggal Dibuat</p>
                </div>
                <p className="text-xs font-bold text-gray-800 leading-snug pl-0.5">{formatDate(historyData.request.created_at)}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4 border-b border-gray-200/60 pb-3">
                <Activity size={16} className="text-blue-600" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-700">Perubahan Status / Progress</h4>
              </div>

              {historyData.history.filter(item => item.title !== 'Request dibuat').length === 0 ? (
                <div className="rounded-xl bg-white p-4 text-center text-xs font-semibold text-gray-400 border border-dashed border-gray-200">
                  Belum ada riwayat perubahan status terbaru.
                </div>
              ) : (
                <div className="relative pl-3 space-y-4 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-200">
                  {historyData.history.filter(item => item.title !== 'Request dibuat').map((item, index) => (
                    <div key={`${item.title}-${index}`} className="relative flex items-start gap-3.5">
                      <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs ring-4 ring-white">
                        <CheckCircle2 size={14} />
                      </div>
                      <div className="flex-1 rounded-xl border border-gray-100 bg-white p-3.5 shadow-xs transition-all hover:border-gray-200">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="text-sm font-extrabold text-gray-900">{item.title}</p>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                            <Clock size={11} /> {formatDate(item.timestamp)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-600 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : historyList.length > 0 ? (
          <div className="space-y-2.5">
            {historyList.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => void openHistoryModal(item)}
                className="group flex w-full items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-xs transition-all hover:border-blue-300 hover:shadow-md hover:bg-blue-50/30 cursor-pointer"
              >
                <div className="space-y-1">
                  <p className="text-sm font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors">{item.name}</p>
                  <p className="text-xs font-semibold text-gray-500 flex items-center gap-2">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                    {item.category} • {item.quantity} unit
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-2xs ${getOfferStatusClasses(item.offer_status)}`}>
                    {getOfferStatusLabel(item.offer_status)}
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-50 text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500 border border-slate-100">
            Belum ada request yang pernah Anda ambil.
          </div>
        )}
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Ambil Request Produk">
        <div className="space-y-5 px-1 py-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Nama Request</label>
            <div className="rounded-2xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800">{selectedRequest?.name}</div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Stok yang Dibutuhkan</label>
            <div className="rounded-2xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800">{selectedRequest?.quantity}</div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Harga Produk</label>
            <div className="rounded-2xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800">
              {selectedRequest?.reference_price !== null && selectedRequest?.reference_price !== undefined
                ? `Rp ${Number(selectedRequest.reference_price).toLocaleString("id-ID")}`
                : "—"}
            </div>
          </div>

          <div role="alert" className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-900">
            <AlertCircle size={20} className="mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-extrabold">Perhatikan jadwal pengantaran <strong>Tester</strong></p>
              <p className="mt-1 text-sm leading-6">
                Setelah konfirmasi, silakan siapkan <strong>Tester</strong> untuk diantar ke mitra pada tanggal yang ditentukan.
              </p>
              <p className="mt-2 text-xs font-bold text-amber-700">
                Tanggal antar ke mitra: {formatDepartureDate(selectedRequest?.hotel_departure_date)}
              </p>
            </div>
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
              type="button"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-95"
              onClick={() => {
                setIsModalOpen(false);
                setIsConfirmationOpen(true);
              }}
            >
              Ambil Request
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isConfirmationOpen} onClose={() => setIsConfirmationOpen(false)} title="Konfirmasi Ambil Request">
        <form onSubmit={handleTakeRequest} className="space-y-5 px-1 py-2">
          <div role="alert" className="flex gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 text-blue-950 shadow-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <AlertCircle size={19} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-blue-950">Kesediaan Menyediakan Produk</p>
              <p className="mt-1 text-sm leading-6 text-blue-900/80">
                Apabila <strong>Tester</strong> Anda disetujui, Anda harus siap mengantar produk dan mengikuti harga yang telah ditentukan Admin.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
            <button
              type="button"
              className="rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50"
              onClick={() => setIsConfirmationOpen(false)}
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 active:scale-95"
            >
              Konfirmasi
            </button>
          </div>
        </form>
      </Modal>

      {/* Floating WhatsApp Button */}
      <FloatingWhatsAppButton />
    </div>
  );
}
