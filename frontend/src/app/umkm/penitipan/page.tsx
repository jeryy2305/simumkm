"use client";

import { useState, useEffect } from "react";
import { ClipboardList, MapPin, ChevronRight, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { API_URL, authFetch, parseJson } from "@/lib/auth";
import FloatingWhatsAppButton from "@/components/FloatingWhatsAppButton";

export default function PenitipanUMKM() {
  const [consignments, setConsignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [umkmStatus, setUmkmStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        try {
          const dashRes = await authFetch(`${API_URL}/api/umkm-user/dashboard`);
          if (dashRes.ok) {
            const dashData = await parseJson<any>(dashRes);
            if (dashData?.umkm?.status === "inactive") {
              setUmkmStatus("inactive");
              setLoading(false);
              return;
            }
          }
        } catch (e) { }

        const res = await authFetch(`${API_URL}/api/umkm-user/consignments`);
        if (res.ok) {
          const data = await parseJson<any[]>(res);
          setConsignments(data);
        } else {
          let errorMessage = res.statusText;
          try {
            const errorData = await parseJson<{ message?: string }>(res);
            errorMessage = errorData?.message || errorMessage;
          } catch (parseError) {
            // If not JSON, keep status text
          }
          console.error("Penitipan UMKM fetch failed", errorMessage);
          setError(errorMessage);
        }
      } catch (err) {
        console.error("Fetch consignments failed", err);
        setError(err instanceof Error ? err.message : "Terjadi kesalahan jaringan");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredConsignments = consignments.filter(c => filterStatus === 'all' || c.status === filterStatus);

  if (umkmStatus === "inactive") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center font-sans text-gray-800 px-4">
        <div className="max-w-md w-full bg-white border border-gray-100 rounded-[2.5rem] p-10 md:p-12 shadow-2xl flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-6">
            <AlertCircle size={48} className="text-amber-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-blue-950 mb-4 tracking-tight">Akun Dalam Peninjauan</h2>
          <p className="text-gray-500 mb-10 leading-relaxed text-[15px]">
            Akun kemitraan UMKM Anda saat ini berstatus tidak aktif. Silakan hubungi tim manajemen kami untuk mengaktifkan kembali akun agar Anda bisa mengakses seluruh rekam jejak penyaluran.
          </p>
          <a
            href="https://wa.me/62819809141?text=Halo%20Admin%20PT.%20Ade%20Mestakung%20Abadi,%20saya%20ingin%20meminta%20bantuan%20aktivasi%20lagi%20akun%20UMKM%20saya"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-amber-500 hover:bg-amber-600 text-blue-950 font-extrabold rounded-2xl shadow-xl shadow-amber-500/20 transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
            Hubungi Admin Sekarang
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 font-sans text-gray-800">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-blue-950">Daftar Titipan</h2>
        <p className="text-sm text-gray-500 mt-1">Pantau lokasi dan status riwayat penyaluran produk Anda secara real-time.</p>
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 bg-gray-100/80 rounded-2xl mb-6 shadow-inner">
        <button
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${filterStatus === 'active' ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-800'}`}
          onClick={() => setFilterStatus('active')}
        >
          Aktif Bergerak
        </button>
        <button
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${filterStatus === 'completed' ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-800'}`}
          onClick={() => setFilterStatus('completed')}
        >
          Selesai Dititip
        </button>
        <button
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${filterStatus === 'cancelled' ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-800'}`}
          onClick={() => setFilterStatus('cancelled')}
        >
          Retur / Batal
        </button>
      </div>

      {error && (
        <div className="p-8 max-w-xl mx-auto mt-4 text-center bg-white rounded-3xl border border-red-100 shadow-xl shadow-red-100/50">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <XCircle className="text-red-500" size={32} />
          </div>
          <p className="font-bold text-xl text-gray-900 mb-2">Terjadi Kesalahan</p>
          <p className="text-gray-500 text-sm mb-2">{error}</p>
          <p className="text-gray-400 text-xs">Sesi mungkin telah berakhir (Token Expired) atau Anda tidak memiliki akses.</p>
        </div>
      )}

      {!error && loading ? (
        <div className="p-8 flex justify-center text-sm font-semibold text-blue-500 items-center space-x-2">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Memuat informasi titipan...</span>
        </div>
      ) : (
        /* List */
        <div className="space-y-4">
          {filteredConsignments.map((item) => (
            <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm relative overflow-hidden transition-all hover:border-blue-100 hover:shadow-md active:scale-[0.98] group cursor-pointer">
              <div className={`absolute top-0 left-0 w-1.5 h-full transition-colors ${item.status === 'active' ? 'bg-amber-400' : (item.status === 'completed' ? 'bg-green-500' : 'bg-red-500')}`}></div>

              <div className="flex justify-between items-start mb-4 pl-2">
                <div>
                  <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2.5 py-1 rounded-full w-max mb-2 uppercase tracking-widest flex items-center gap-1">
                    trx-{item.id}
                  </span>
                  <h3 className="font-extrabold text-gray-900 text-base md:text-lg group-hover:text-blue-900 transition-colors">{item.company}</h3>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 justify-end ${item.status === 'active' ? 'text-amber-600' : (item.status === 'completed' ? 'text-green-600' : 'text-red-600')}`}>
                    {item.status === 'active' && <Clock size={12} />}
                    {item.status === 'completed' && <CheckCircle2 size={12} />}
                    {item.status === 'cancelled' && <XCircle size={12} />}
                    {item.status === 'active' ? 'Bergerak' : (item.status === 'completed' ? 'Tuntas' : 'Retur')}
                  </p>
                  <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase tracking-widest">{new Date(item.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 bg-gray-50/80 p-4 rounded-xl border border-gray-100 group-hover:bg-blue-50/30 transition-colors ml-2">
                <div className="flex items-center gap-3 text-xs md:text-sm text-gray-600 font-medium">
                  <MapPin size={16} className="text-blue-400 shrink-0" />
                  <span className="truncate">{item.company}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs md:text-sm text-gray-600 font-medium">
                    <ClipboardList size={16} className="text-amber-500 shrink-0" />
                    <span><strong className="text-blue-950">{item.quantity}</strong> unit {item.product?.name || 'Produk'} dititipkan</span>
                  </div>
                  <button className="text-blue-600 bg-blue-100 p-1.5 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredConsignments.length === 0 && (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-3xl text-center flex flex-col items-center justify-center text-gray-500 p-12">
              <ClipboardList size={40} className="text-gray-300 mb-4" />
              <p className="text-base font-bold text-gray-600">Arsip Kosong</p>
              <p className="text-sm mt-1 max-w-xs">Tidak ada rekam jejak penitipan produk untuk kategori status ini.</p>
            </div>
          )}
        </div>
      )}
      
      {/* Floating WhatsApp Button */}
      <FloatingWhatsAppButton />
    </div>
  );
}
