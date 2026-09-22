import { AlertCircle, LogOut, ShoppingBag } from "lucide-react";
import { logout } from "@/lib/auth";

export default function InactiveAccountNotice() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm sm:px-6">
        <div className="flex items-center gap-2">
          <ShoppingBag className="text-blue-900" size={22} />
          <span className="font-bold text-gray-800">SIM UMKM</span>
        </div>
        <button
          type="button"
          onClick={async () => {
            await logout();
            window.location.href = "/login";
          }}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut size={17} />
          Logout
        </button>
      </header>

      <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-gray-100 rounded-[2.5rem] p-10 md:p-12 shadow-2xl flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-6">
            <AlertCircle size={48} className="text-amber-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-blue-950 mb-4 tracking-tight">Akun Dinonaktifkan</h2>
          <p className="text-gray-500 mb-10 leading-relaxed text-[15px]">
            Akun UMKM Anda sedang dinonaktifkan sehingga akses ke halaman akun dibatasi. Silakan hubungi Admin untuk mendapatkan bantuan.
          </p>
          <a
            href="https://wa.me/62819809141?text=Halo%20Admin%20PT.%20Ade%20Mestakung%20Abadi,%20akun%20UMKM%20saya%20dinonaktifkan%20dan%20saya%20ingin%20meminta%20bantuan."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-amber-500 hover:bg-amber-600 text-blue-950 font-extrabold rounded-2xl shadow-xl shadow-amber-500/20 transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]"
          >
            Hubungi Admin via WhatsApp
          </a>
        </div>
      </main>
    </div>
  );
}
