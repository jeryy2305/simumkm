"use client";

import { useState, useEffect } from "react";
import { API_URL, authFetch, parseJson, getAuthUser } from "@/lib/auth";
import { User, Check, AlertCircle } from "lucide-react";

interface ProfileUser {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function ProfilePage() {
  const currentUser = getAuthUser();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [nameForm, setNameForm] = useState({ name: "", email: "" });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authFetch(`${API_URL}/api/profile`);

      if (!res.ok) {
        throw new Error("Gagal memuat profil");
      }

      const data = await parseJson<{ user: ProfileUser }>(res);
      setUser(data.user);
      setNameForm({ name: data.user.name, email: data.user.email });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setIsSubmitting(true);

    try {
      const res = await authFetch(`${API_URL}/api/profile/update`, {
        method: "POST",
        body: JSON.stringify(nameForm),
      });

      if (!res.ok) {
        const data = await parseJson<{ errors?: Record<string, string[]> }>(res);
        if (data.errors) {
          const errors: Record<string, string> = {};
          Object.entries(data.errors).forEach(([key, messages]) => {
            errors[key] = messages[0];
          });
          setFormErrors(errors);
        }
        throw new Error("Gagal memperbarui profil");
      }

      const result = await parseJson<{ message: string; user: ProfileUser }>(res);
      setUser(result.user);
      setSuccessMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center space-x-3 text-blue-600">
          <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="font-semibold tracking-wide">Memuat profil...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-blue-950 tracking-tight mb-2">Profil & Keamanan</h1>
          <p className="text-gray-600 text-lg">Kelola informasi profil dan keamanan akun Anda</p>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="mb-8 p-5 bg-linear-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl shadow-lg flex items-start gap-4">
            <Check className="w-6 h-6 text-emerald-600 shrink-0 mt-1" />
            <div>
              <p className="font-bold text-emerald-900 mb-1">Berhasil!</p>
              <p className="text-emerald-800">{successMessage}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-8 p-5 bg-linear-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl shadow-lg flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-1" />
            <div>
              <p className="font-bold text-red-900 mb-1">Error</p>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden sticky top-8">
              {/* Header linear */}
              <div className="h-32 bg-linear-to-br from-blue-950 via-blue-900 to-blue-800"></div>

              {/* Profile Info */}
              <div className="relative px-6 pb-6">
                <div className="flex flex-col items-center -mt-16 mb-6">
                  <div className="w-28 h-28 bg-linear-to-br from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center mb-4 shadow-xl border-4 border-white">
                    <User className="w-14 h-14 text-blue-950" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-blue-950 text-center">{user?.name}</h2>
                  <p className="text-sm text-gray-500 mt-2 text-center">{user?.email}</p>
                </div>

                <div className="mb-6 text-center">
                  <span className="inline-block px-4 py-2 bg-linear-to-r from-blue-100 to-blue-50 text-blue-900 text-xs font-bold rounded-full border border-blue-200 uppercase tracking-wider">
                    {user?.role}
                  </span>
                </div>

                <hr className="mb-6 border-gray-200" />

                <div className="space-y-4 text-center">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Bergabung Sejak</p>
                    <p className="text-sm font-bold text-gray-900">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" }) : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Status</p>
                    <p className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 text-sm font-bold rounded-lg border border-green-200">
                      <Check className="w-4 h-4" />
                      Terverifikasi
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-linear-to-r from-blue-950 to-blue-900 px-8 py-6">
                <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
                  <User className="w-6 h-6" />
                  Informasi Profil
                </h2>
              </div>

              <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={nameForm.name}
                    onChange={(e) => setNameForm({ ...nameForm, name: e.target.value })}
                    className={`w-full px-5 py-3 border-2 rounded-xl outline-none transition ${formErrors.name ? "border-red-500" : "border-gray-200"} focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-base font-medium`}
                    placeholder="Nama lengkap"
                  />
                  {formErrors.name && <p className="text-red-600 text-sm mt-2">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                    Email
                  </label>
                  <input
                    type="email"
                    value={nameForm.email}
                    onChange={(e) => setNameForm({ ...nameForm, email: e.target.value })}
                    className={`w-full px-5 py-3 border-2 rounded-xl outline-none transition ${formErrors.email ? "border-red-500" : "border-gray-200"} focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-base font-medium`}
                    placeholder="Alamat email"
                  />
                  {formErrors.email && <p className="text-red-600 text-sm mt-2">{formErrors.email}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl transition duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Memproses...
                    </>
                  ) : (
                    "Simpan Perubahan"
                  )}
                </button>
              </form>
            </div>

            {/* Security Tips */}
            <div className="mt-8 bg-linear-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-3xl p-8 shadow-lg">
              <div className="flex gap-4">
                <AlertCircle className="w-8 h-8 text-amber-600 shrink-0 mt-1" />
                <div>
                  <p className="font-extrabold text-amber-950 mb-4 text-lg">🔐 Tips Keamanan Akun</p>
                  <ul className="list-disc list-inside space-y-2 text-amber-900 text-sm font-medium">
                    <li>Gunakan password yang kuat dan unik, jangan gunakan data pribadi</li>
                    <li>Jangan bagikan password Anda kepada siapapun, termasuk admin</li>
                    <li>Ubah password secara berkala (minimal 3 bulan sekali)</li>
                    <li>Logout dari perangkat yang tidak dikenal atau tidak aman</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
