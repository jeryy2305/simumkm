"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Search, Package, Tag, CheckCircle2, AlertCircle, History } from "lucide-react";
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
  purpose?: string | null;
  status: "open" | "taken" | "completed" | "cancelled";
  taken_by_umkm?: { id: number; owner: string; name?: string } | null;
  created_at?: string;
  updated_at?: string;
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
}

export default function RequestProdukUMKM() {
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ProductRequest | null>(null);
  const [offerPrice, setOfferPrice] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  }, [fetchRequests]);

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
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      const primaryId = isMobile ? `request-mobile-${requestId}` : `request-${requestId}`;
      const fallbackId = isMobile ? `request-${requestId}` : `request-mobile-${requestId}`;
      
      const element = document.getElementById(primaryId) || document.getElementById(fallbackId);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("bg-amber-100/50", "transition-all", "duration-1000");
          setTimeout(() => {
            element.classList.remove("bg-amber-100/50");
          }, 3000);
        }, 150); // slightly longer timeout to guarantee painting is fully complete
      }
    }
  }, [loading, requests]);

  const openTakeModal = (request: ProductRequest) => {
    setSelectedRequest(request);
    setOfferPrice(request.reference_price ?? 0);
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

  const getHistoryStatusLabel = (status?: string) => {
    switch (status) {
      case "Dalam Penyaluran":
        return "Dalam Penyaluran";
      case "Selesai Dititip":
        return "Selesai Dititip";
      case "Retur":
        return "Retur";
      default:
        return "Sedang Ditinjau";
    }
  };

  const getHistoryStatusClasses = (status?: string) => {
    switch (status) {
      case "Dalam Penyaluran":
        return "bg-amber-100 text-amber-700";
      case "Selesai Dititip":
        return "bg-emerald-100 text-emerald-700";
      case "Retur":
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
      setHistoryList(data);
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
        body: JSON.stringify({ price_offered: offerPrice }),
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

      const result = await parseJson<{ request: ProductRequest; product: unknown }>(response);
      setRequests((prev) => prev.map((item) => (item.id === result.request.id ? result.request : item)));
      setNotification({ type: "success", message: "Request berhasil diambil. Produk baru telah dibuat." });
      setIsModalOpen(false);
      setSelectedRequest(null);
    } catch (err: unknown) {
      setNotification({ type: "error", message: err instanceof Error ? err.message : "Terjadi kesalahan saat mengambil request" });
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      const term = searchTerm.toLowerCase();
      return (
        item.name.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
        item.purpose?.toLowerCase().includes(term) ||
        item.status.toLowerCase().includes(term)
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
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
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
                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">ID</th>
                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Request</th>
                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Kategori</th>
                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100 text-center">Kuantitas</th>
                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Budget</th>
                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100">Status</th>
                    <th className="py-5 px-6 text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-100 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredRequests.map((item) => (
                    <tr key={item.id} id={`request-${item.id}`} className="hover:bg-blue-50/40 transition-colors group">
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
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${item.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                          {item.status === 'open' ? 'Terbuka' : 'Diambil'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {item.status === 'open' ? (
                          <button
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all active:scale-95"
                            onClick={() => openTakeModal(item)}
                          >
                            <Package size={16} /> Ambil Request
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100 text-slate-700 text-sm font-semibold">
                            <CheckCircle2 size={16} /> Diambil
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredRequests.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-gray-500">
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
                  <article key={item.id} id={`request-mobile-${item.id}`} className="rounded-4xl border border-gray-100 bg-slate-50 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-extrabold text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500 mt-1">#{item.id} • {item.category}</p>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${item.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                        {item.status === 'open' ? 'Terbuka' : 'Diambil'}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-gray-700">
                      <div className="flex items-center justify-between gap-2 rounded-3xl bg-white px-4 py-3 shadow-sm border border-gray-100">
                        <span className="text-slate-500">Kuantitas</span>
                        <span className="font-semibold">{item.quantity}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 rounded-3xl bg-white px-4 py-3 shadow-sm border border-gray-100">
                        <span className="text-slate-500">Budget</span>
                        <span className="font-semibold">{item.reference_price ? `Rp ${Number(item.reference_price).toLocaleString('id-ID')}` : '—'}</span>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-gray-500 line-clamp-3">{item.purpose || 'Tidak ada tujuan'}</p>

                    <div className="mt-4 flex justify-end">
                      {item.status === 'open' ? (
                        <button
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-95"
                          onClick={() => openTakeModal(item)}
                        >
                          <Package size={16} /> Ambil Request
                        </button>
                      ) : (
                        <div className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
                          <CheckCircle2 size={16} /> Diambil
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
          <div className="flex items-center justify-center py-10 text-blue-600">
            <div className="mr-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
            <span className="font-semibold">Memuat history request...</span>
          </div>
        ) : historyError ? (
          <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600">{historyError}</div>
        ) : historyData ? (
          <div className="space-y-5">
            <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Request</p>
                  <h3 className="mt-1 text-xl font-extrabold text-gray-900">{historyData.request.name}</h3>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${getHistoryStatusClasses(historyData.status_label)}`}>
                  {getHistoryStatusLabel(historyData.status_label)}
                </span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Nama Produk</p>
                <p className="mt-2 text-sm font-semibold text-gray-800">{historyData.request.name}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Jumlah</p>
                <p className="mt-2 text-sm font-semibold text-gray-800">{historyData.request.quantity}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Harga yang Ditawarkan</p>
                <p className="mt-2 text-sm font-semibold text-gray-800">
                  {historyData.request.price_offered ? `Rp ${Number(historyData.request.price_offered).toLocaleString("id-ID")}` : "—"}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Status Request</p>
                <p className="mt-2 text-sm font-semibold text-gray-800">{getHistoryStatusLabel(historyData.status_label)}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Tanggal Request Dibuat</p>
                <p className="mt-2 text-sm font-semibold text-gray-800">{formatDate(historyData.request.created_at)}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Tanggal Request Diambil</p>
                <p className="mt-2 text-sm font-semibold text-gray-800">{formatDate(historyData.request.updated_at)}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Perubahan Status / Progress</p>
              <div className="mt-4 space-y-3">
                {historyData.history.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-extrabold text-gray-900">{item.title}</p>
                        <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                      </div>
                      <span className="text-xs font-semibold text-gray-400">{formatDate(item.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : historyList.length > 0 ? (
          <div className="space-y-3">
            {historyList.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => void openHistoryModal(item)}
                className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50"
              >
                <div>
                  <p className="text-sm font-extrabold text-gray-900">{item.name}</p>
                  <p className="mt-1 text-sm text-gray-500">{item.category} • {item.quantity} unit</p>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${getHistoryStatusClasses(item.history_status)}`}>
                  {getHistoryStatusLabel(item.history_status)}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-600">
            Belum ada request yang pernah Anda ambil.
          </div>
        )}
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Ambil Request Produk">
        <form onSubmit={handleTakeRequest} className="space-y-5 px-1 py-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Nama Request</label>
            <div className="rounded-2xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800">{selectedRequest?.name}</div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Kuantitas</label>
            <div className="rounded-2xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800">{selectedRequest?.quantity}</div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Harga Penawaran (Rp)</label>
            <input
              type="number"
              min="0"
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm font-semibold text-gray-800"
              value={offerPrice}
              onChange={(e) => setOfferPrice(Number(e.target.value))}
              placeholder="Masukkan harga yang Anda tawarkan"
            />
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
              Ambil Request
            </button>
          </div>
        </form>
      </Modal>

      {/* Floating WhatsApp Button */}
      <FloatingWhatsAppButton />
    </div>
  );
}
