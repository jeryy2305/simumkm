"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Mail, Lock, LogIn, ArrowLeft } from "lucide-react";
import { API_URL, setAuthToken, clearAuthToken, parseJson, setAuthUser } from "@/lib/auth";

interface LoginResponse {
    token: string;
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
    };
}

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        clearAuthToken();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const rawText = await response.text();
                let message = rawText;
                try {
                    const json = JSON.parse(rawText);
                    message = json?.message || rawText;
                } catch {
                    message = rawText;
                }
                setError(message.slice(0, 200) || "Email atau password salah.");
                return;
            }

            const data = await parseJson<LoginResponse>(response);

            setAuthToken(data.token);
            setAuthUser(data.user);

            if (data.user.role === "admin") {
                router.push("/admin/dashboard");
            } else {
                router.push("/umkm/dashboard");
            }
        } catch (err) {
            setError("Tidak dapat terhubung ke server. Coba lagi.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-blue-950 flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-l from-blue-700/20 to-transparent pointer-events-none hidden sm:block"></div>
            <div className="absolute -bottom-40 -left-40 w-64 h-64 sm:w-96 sm:h-96 bg-blue-600 rounded-full blur-[100px] opacity-30 pointer-events-none"></div>

            <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-10">
                <Link href="/" className="flex items-center text-blue-200 hover:text-white transition-colors text-xs sm:text-sm font-medium">
                    <ArrowLeft size={16} className="mr-2 sm:mr-2" />
                    <span className="hidden sm:inline">Kembali ke Beranda</span>
                    <span className="sm:hidden">Kembali</span>
                </Link>
            </div>

            <div className="mx-auto w-full max-w-md relative z-10">
                <div className="flex justify-center mb-4 sm:mb-6">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/50">
                        <Building2 className="text-blue-900" size={28} />
                    </div>
                </div>
                <h2 className="mt-2 text-center text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    PT. Ade Mestakung Abadi
                </h2>
                <p className="mt-2 sm:mt-3 text-center text-xs sm:text-sm text-blue-200">
                    Sistem Pembukuan & Manajemen Mitra UMKM
                </p>
            </div>

            <div className="mt-6 sm:mt-8 mx-auto w-full max-w-md relative z-10">
                <div className="bg-white py-8 px-5 sm:py-10 sm:px-10 shadow-2xl rounded-2xl sm:rounded-3xl border border-gray-100">
                    <div className="mb-6 sm:mb-8 text-center">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900">Masuk ke Portal</h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">Gunakan email dan kata sandi Anda</p>
                    </div>

                    {error && (
                        <div className="mb-4 sm:mb-6 rounded-xl bg-red-50 border border-red-200 p-3 sm:p-4 text-xs sm:text-sm text-red-700 flex items-start">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                            {error}
                        </div>
                    )}

                    <form className="space-y-4 sm:space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                                Alamat Email
                            </label>
                            <div className="relative rounded-xl shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 sm:pl-11 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-gray-50 text-gray-900 transition-all outline-none"
                                    placeholder="email@perusahaan.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                                Kata Sandi
                            </label>
                            <div className="relative rounded-xl shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 sm:pl-11 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-gray-50 text-gray-900 transition-all outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-300 rounded cursor-pointer"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-xs sm:text-sm font-medium text-gray-600 cursor-pointer">
                                Ingat saya
                            </label>
                        </div>

                        <div className="pt-1 sm:pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center items-center py-2.5 sm:py-3.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                                        <span>Masuk ke Sistem</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="mt-6 sm:mt-8 text-center">
                    <p className="text-xs text-blue-300/80">
                        &copy; {new Date().getFullYear()} PT. Ade Mestakung Abadi. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}