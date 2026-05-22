@extends('layouts.app')

@section('content')
<div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 md:py-12">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Page Title -->
        <div class="mb-10">
            <h1 class="text-4xl md:text-5xl font-extrabold text-blue-950 tracking-tight mb-2">Profil & Keamanan</h1>
            <p class="text-gray-600 text-lg">Kelola informasi profil dan keamanan akun Anda</p>
        </div>

        <!-- Success & Error Messages -->
        @if ($message = Session::get('success'))
            <div class="mb-8 p-5 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl shadow-lg shadow-emerald-100/50 flex items-start gap-4">
                <svg class="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <div>
                    <p class="font-bold text-emerald-900 mb-1">Berhasil!</p>
                    <p class="text-emerald-800">{{ $message }}</p>
                </div>
            </div>
        @endif

        @if ($errors->any())
            <div class="mb-8 p-5 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl shadow-lg shadow-red-100/50">
                <div class="flex gap-4">
                    <svg class="w-6 h-6 text-red-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                    <div>
                        <p class="font-bold text-red-900 mb-3">Terjadi Kesalahan</p>
                        <ul class="list-disc list-inside space-y-1 text-red-800 text-sm">
                            @foreach ($errors->all() as $error)
                                <li>{{ $error }}</li>
                            @endforeach
                        </ul>
                    </div>
                </div>
            </div>
        @endif

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Sidebar Profile Card -->
            <div class="lg:col-span-1">
                <div class="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden sticky top-8">
                    <!-- Profile Header Gradient -->
                    <div class="h-32 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800"></div>
                    
                    <!-- Profile Info -->
                    <div class="relative px-6 pb-6">
                        <div class="flex flex-col items-center -mt-16 mb-6">
                            <div class="w-28 h-28 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center mb-4 shadow-xl border-4 border-white">
                                <svg class="w-14 h-14 text-blue-950" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                            </div>
                            <h2 class="text-2xl font-extrabold text-blue-950 text-center">{{ $user->name }}</h2>
                            <p class="text-sm text-gray-500 mt-2 text-center">{{ $user->email }}</p>
                        </div>

                        <div class="mb-6 text-center">
                            <span class="inline-block px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-900 text-xs font-bold rounded-full border border-blue-200 uppercase tracking-wider">
                                {{ ucfirst($user->role) }}
                            </span>
                        </div>

                        <hr class="mb-6 border-gray-200">

                        <div class="space-y-4 text-center">
                            <div>
                                <p class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Bergabung Sejak</p>
                                <p class="text-sm font-bold text-gray-900">{{ $user->created_at->format('d M Y') }}</p>
                            </div>
                            <div>
                                <p class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Status Verifikasi</p>
                                <p class="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 text-sm font-bold rounded-lg border border-green-200">
                                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                    </svg>
                                    Terverifikasi
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <div class="lg:col-span-2 space-y-8">
                <!-- Update Profile Section -->
                <div class="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
                    <div class="bg-gradient-to-r from-blue-950 to-blue-900 px-8 py-6">
                        <h2 class="text-2xl font-extrabold text-white flex items-center gap-3">
                            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M11 11H5v2h6v-2zm0-4H5v2h6V7zm0 8H5v2h6v-2zm8-8h-6v2h6V7zm0 4h-6v2h6v-2zm0 4h-6v2h6v-2z"/>
                            </svg>
                            Informasi Profil
                        </h2>
                    </div>
                    
                    <form action="{{ route('profile.update') }}" method="POST" class="p-8 space-y-6">
                        @csrf

                        <!-- Nama -->
                        <div>
                            <label for="name" class="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Nama Lengkap</label>
                            <input 
                                type="text" 
                                id="name" 
                                name="name" 
                                value="{{ old('name', $user->name) }}"
                                class="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-base font-medium placeholder-gray-400"
                            >
                            @error('name')
                                <p class="text-red-600 text-sm mt-2 flex items-center gap-2">
                                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                                    {{ $message }}
                                </p>
                            @enderror
                        </div>

                        <!-- Email -->
                        <div>
                            <label for="email" class="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Email</label>
                            <input 
                                type="email" 
                                id="email" 
                                name="email" 
                                value="{{ old('email', $user->email) }}"
                                class="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-base font-medium placeholder-gray-400"
                            >
                            @error('email')
                                <p class="text-red-600 text-sm mt-2 flex items-center gap-2">
                                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                                    {{ $message }}
                                </p>
                            @enderror
                        </div>

                        <!-- Submit Button -->
                        <button 
                            type="submit"
                            class="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-xl transition duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                            </svg>
                            Simpan Perubahan
                        </button>
                    </form>
                </div>

                <!-- Change Password Section -->
                <div class="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
                    <div class="bg-gradient-to-r from-red-600 to-red-700 px-8 py-6">
                        <h2 class="text-2xl font-extrabold text-white flex items-center gap-3">
                            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18 8h-1V7c0-2.76-2.24-5-5-5s-5 2.24-5 5v1H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V7c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v1z"/>
                            </svg>
                            Ubah Password
                        </h2>
                    </div>
                    
                    <form action="{{ route('profile.change-password') }}" method="POST" class="p-8 space-y-6">
                        @csrf

                        <!-- Current Password -->
                        <div>
                            <label for="current_password" class="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Password Lama</label>
                            <input 
                                type="password" 
                                id="current_password" 
                                name="current_password"
                                class="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition text-base font-medium placeholder-gray-400"
                                placeholder="Masukkan password lama Anda"
                            >
                            @error('current_password')
                                <p class="text-red-600 text-sm mt-2 flex items-center gap-2">
                                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                                    {{ $message }}
                                </p>
                            @enderror
                        </div>

                        <!-- New Password -->
                        <div>
                            <label for="new_password" class="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Password Baru</label>
                            <input 
                                type="password" 
                                id="new_password" 
                                name="new_password"
                                class="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition text-base font-medium placeholder-gray-400"
                                placeholder="Minimal 8 karakter"
                            >
                            @error('new_password')
                                <p class="text-red-600 text-sm mt-2 flex items-center gap-2">
                                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                                    {{ $message }}
                                </p>
                            @enderror
                            <p class="text-xs text-gray-600 mt-2 flex items-center gap-2">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 100 2v3a1 1 0 002 0v-3a1 1 0 00-1-1z" clip-rule="evenodd" />
                                </svg>
                                Gunakan kombinasi huruf besar, huruf kecil, angka & simbol untuk password yang kuat
                            </p>
                        </div>

                        <!-- Confirm Password -->
                        <div>
                            <label for="new_password_confirmation" class="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Konfirmasi Password Baru</label>
                            <input 
                                type="password" 
                                id="new_password_confirmation" 
                                name="new_password_confirmation"
                                class="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition text-base font-medium placeholder-gray-400"
                                placeholder="Ketik ulang password baru"
                            >
                            @error('new_password_confirmation')
                                <p class="text-red-600 text-sm mt-2 flex items-center gap-2">
                                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                                    {{ $message }}
                                </p>
                            @enderror
                        </div>

                        <!-- Submit Button -->
                        <button 
                            type="submit"
                            class="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 px-6 rounded-xl transition duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                            </svg>
                            Ubah Password
                        </button>
                    </form>
                </div>

                <!-- Security Tips -->
                <div class="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-3xl p-8 shadow-lg shadow-amber-100/50">
                    <div class="flex gap-4">
                        <svg class="w-8 h-8 text-amber-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                        <div>
                            <p class="font-extrabold text-amber-950 mb-4 text-lg">🔐 Tips Keamanan Akun</p>
                            <ul class="list-disc list-inside space-y-2 text-amber-900 text-sm font-medium">
                                <li>Gunakan password yang kuat dan unik, jangan gunakan data pribadi</li>
                                <li>Jangan bagikan password Anda kepada siapapun, termasuk admin</li>
                                <li>Ubah password secara berkala (minimal 3 bulan sekali)</li>
                                <li>Logout dari perangkat yang tidak dikenal atau tidak aman</li>
                                <li>Aktifkan 2FA jika fitur tersedia untuk keamanan maksimal</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
