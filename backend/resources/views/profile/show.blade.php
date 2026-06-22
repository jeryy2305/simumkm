                <!-- Security Tips -->
            <!-- Main Content -->
            <div class="lg:col-span-2 space-y-8">
                <!-- Update Profile Section -->
                <div class="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
                    <div class="bg-linear-to-r from-blue-950 to-blue-900 px-8 py-6">
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
                            class="w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-xl transition duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
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
                    <div class="bg-linear-to-r from-red-600 to-red-700 px-8 py-6">
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
                            class="w-full bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 px-6 rounded-xl transition duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                            </svg>
                            Ubah Password
                        </button>
                    </form>
                </div>

                <!-- Security Tips -->
                <div class="bg-linear-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-3xl p-8 shadow-lg shadow-amber-100/50">
                    <div class="flex gap-4">
                        <svg class="w-8 h-8 text-amber-600 shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
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
