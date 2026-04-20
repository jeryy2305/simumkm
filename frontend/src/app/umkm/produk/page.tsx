"use client";

import { useState, useEffect } from "react";
import { Search, Package, AlertCircle } from "lucide-react";
import { API_URL, authFetch, parseJson } from "@/lib/auth";

export default function ProdukUMKM() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [umkmStatus, setUmkmStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cek status terlebih dahulu
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

        const res = await authFetch(`${API_URL}/api/umkm-user/products`);
        if (res.ok) {
          const data = await parseJson<any[]>(res);
          setProducts(data);
        } else {
          let errorMessage = res.statusText;
          try {
            const errorData = await parseJson<{ message?: string }>(res);
            errorMessage = errorData?.message || errorMessage;
          } catch (parseError) {
            // If not JSON, keep status text
          }
          console.error("Produk UMKM fetch failed", errorMessage);
          setError(errorMessage);
        }
      } catch (err) {
        console.error("Fetch products failed", err);
        setError(err instanceof Error ? err.message : "Terjadi kesalahan jaringan");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (umkmStatus === "inactive") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center font-sans text-gray-800 px-4">
        <div className="max-w-md w-full bg-white border border-gray-100 rounded-[2.5rem] p-10 md:p-12 shadow-2xl flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-6">
            <AlertCircle size={48} className="text-amber-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-blue-950 mb-4 tracking-tight">Akun Dalam Peninjauan</h2>
          <p className="text-gray-500 mb-10 leading-relaxed text-[15px]">
            Akun kemitraan UMKM Anda saat ini berstatus tidak aktif. Silakan hubungi tim manajemen kami untuk mengaktifkan kembali akun agar Anda bisa mengakses seluruh fitur.
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
        <h2 className="text-2xl font-extrabold text-blue-950">Katalog Produk</h2>
        <p className="text-sm text-gray-500 mt-1">Kelola data seluruh produk UMKM Anda yang tersedia di sistem.</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={20} className="text-blue-400" />
          </div>
          <input
            type="text"
            placeholder="Cari produk Anda..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white shadow-sm transition-all"
          />
        </div>
      </div>

      {error && (
        <div className="p-8 max-w-xl mx-auto mt-4 text-center bg-white rounded-3xl border border-red-100 shadow-xl shadow-red-100/50">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 font-bold text-2xl">!</span>
          </div>
          <p className="font-bold text-xl text-gray-900 mb-2">Terjadi Kesalahan</p>
          <p className="text-gray-500 text-sm mb-2">{error}</p>
          <p className="text-gray-400 text-xs">Akses data gagal karena token kedaluwarsa atau terjadi masalah otorisasi.</p>
        </div>
      )}

      {!error && loading ? (
        <div className="p-8 flex justify-center text-sm font-semibold text-blue-500 items-center space-x-2">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Memuat produk...</span>
        </div>
      ) : (
        /* Product List */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
          {products
            .filter((product) =>
              product.name?.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((product) => (
              <div key={product.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg overflow-hidden flex flex-col group transition-all duration-300 hover:-translate-y-1">
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight mb-3 group-hover:text-blue-800 transition-colors">{product.name}</h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stok Tersedia</span>
                      <span className={`text-sm font-extrabold ${product.quantity > 10 ? 'text-green-600' : product.quantity > 0 ? 'text-amber-600' : 'text-gray-600'}`}>
                        {product.quantity} unit
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</span>
                      <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        product.cancelled_quantity > 0
                          ? 'bg-red-100 text-red-700'
                          : product.quantity > 0 
                            ? 'bg-amber-100 text-amber-700' 
                            : product.status === 'available' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                      }`}>
                        {product.cancelled_quantity > 0
                          ? 'Retur'
                          : product.quantity > 0 
                            ? 'Dalam Penyaluran' 
                            : product.status === 'available' 
                              ? '✓ Siap Dititip' 
                              : 'Habis'}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-lg font-extrabold text-blue-700 mt-auto">Rp {Number(product.price).toLocaleString('id-ID')}</p>
                </div>
              </div>
            ))}
          {products.filter((product) =>
            product.name?.toLowerCase().includes(searchTerm.toLowerCase())
          ).length === 0 && (
              <div className="col-span-full bg-gray-50 rounded-3xl text-center text-sm text-gray-500 p-8 border border-dashed border-gray-200">
                Daftar produk tidak ditemukan.
              </div>
            )}
        </div>
      )}
    </div>
  );
}
