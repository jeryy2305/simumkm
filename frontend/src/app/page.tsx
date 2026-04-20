"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Building2, UtensilsCrossed, TrendingUp, Menu, X, ShieldCheck, MapPin, Mail, Phone } from "lucide-react";

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex flex-col min-h-screen font-sans text-gray-800 bg-white">
      {/* Header */}
      <header className={`px-6 py-4 sticky top-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100" : "bg-white border-b border-transparent"}`}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center text-white">
              <Building2 size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-blue-950 leading-none">PT. Ade Mestakung Abadi</span>
              <span className="text-xs font-semibold text-blue-600 tracking-wider mt-1">DISTRIBUSI & PERDAGANGAN</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#beranda" className="text-sm font-semibold text-gray-600 hover:text-blue-700 transition-colors uppercase tracking-wide">Beranda</a>
            <a href="#layanan" className="text-sm font-semibold text-gray-600 hover:text-blue-700 transition-colors uppercase tracking-wide">Layanan</a>
            <a href="#tentang" className="text-sm font-semibold text-gray-600 hover:text-blue-700 transition-colors uppercase tracking-wide">Tentang Kami</a>
            <a href="#kontak" className="text-sm font-semibold text-gray-600 hover:text-blue-700 transition-colors uppercase tracking-wide">Kontak</a>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <Link href="/login">
              <button className="px-6 py-2.5 bg-blue-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors shadow-md shadow-blue-900/20 cursor-pointer">
                Portal Mitra UMKM
              </button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-blue-950 p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden pt-6 pb-4 border-t border-gray-100 mt-4 space-y-5 px-2">
            <a href="#beranda" onClick={() => setIsMenuOpen(false)} className="block text-gray-700 hover:text-blue-800 font-semibold text-lg">Beranda</a>
            <a href="#layanan" onClick={() => setIsMenuOpen(false)} className="block text-gray-700 hover:text-blue-800 font-semibold text-lg">Fitur & Layanan</a>
            <a href="#tentang" onClick={() => setIsMenuOpen(false)} className="block text-gray-700 hover:text-blue-800 font-semibold text-lg">Tentang Perusahaan</a>
            <a href="#kontak" onClick={() => setIsMenuOpen(false)} className="block text-gray-700 hover:text-blue-800 font-semibold text-lg">Kontak</a>
            <div className="pt-4 border-t border-gray-100">
              <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                <button className="w-full py-3 bg-blue-900 text-white font-semibold rounded-xl shadow-md">
                  Akses Portal Mitra
                </button>
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section id="beranda" className="relative bg-blue-950 text-white py-24 md:py-32 overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-l from-blue-700/30 to-transparent"></div>

          <div className="relative px-6 mx-auto max-w-7xl z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-800/50 border border-blue-700/50 text-blue-200 text-sm font-medium mb-6 backdrop-blur-sm">
                <ShieldCheck size={16} className="mr-2" /> Partner Distribusi Terpercaya
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6">
                Menghubungkan UMKM <br className="hidden md:block" />
                dengan <span className="text-blue-400">Industri Perhotelan</span>
              </h1>
              <p className="text-lg md:text-xl text-blue-100/90 mb-10 max-w-2xl mx-auto md:mx-0 leading-relaxed">
                PT. Ade Mestakung Abadi hadir memberikan solusi menyeluruh untuk distribusi produk unggulan UMKM, penyediaan layanan katering, serta perdagangan umum yang profesional dan efisien.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                <a href="#layanan" className="w-full sm:w-auto px-8 py-4 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center">
                  Jelajahi Layanan <ArrowRight size={20} className="ml-2" />
                </a>
                <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm text-white font-bold rounded-xl transition-all text-center">
                  Masuk Portal Admin
                </Link>
              </div>
            </div>

            <div className="flex-1 hidden lg:flex justify-center relative">
              <div className="w-full max-w-md aspect-4/3 bg-linear-to-tr from-blue-800 to-blue-600 rounded-3xl p-1 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="w-full h-full bg-blue-950 rounded-[22px] overflow-hidden relative">
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-blue-900 to-transparent"></div>
                  <div className="p-8 h-full flex flex-col pt-12">
                    <div className="flex justify-between items-end mt-auto space-x-4">
                      <div className="w-1/3 bg-blue-400/80 h-24 rounded-t-lg"></div>
                      <div className="w-1/3 bg-blue-300 h-40 rounded-t-lg shadow-lg"></div>
                      <div className="w-1/3 bg-blue-500/80 h-32 rounded-t-lg"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Layanan Section */}
        <section id="layanan" className="py-24 bg-gray-50">
          <div className="px-6 mx-auto max-w-7xl">
            <div className="text-center mb-20">
              <span className="text-blue-700 font-bold tracking-wider uppercase text-sm">Layanan Perusahaan</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-3 mb-6">Solusi Bisnis Terintegrasi</h2>
              <div className="w-24 h-1.5 bg-blue-600 mx-auto rounded-full"></div>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className="w-16 h-16 bg-blue-50 group-hover:bg-blue-600 rounded-2xl flex items-center justify-center mb-8 transition-colors">
                  <Building2 size={32} className="text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Distribusi Hotel</h3>
                <p className="text-gray-600 leading-relaxed">
                  Menyalurkan produk-produk premium dari UMKM lokal untuk memenuhi standar dan kebutuhan industri perhotelan bintang lima.
                </p>
              </div>

              <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className="w-16 h-16 bg-blue-50 group-hover:bg-blue-600 rounded-2xl flex items-center justify-center mb-8 transition-colors">
                  <UtensilsCrossed size={32} className="text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Jasa Katering</h3>
                <p className="text-gray-600 leading-relaxed">
                  Penyediaan layanan makanan dan minuman berkualitas tinggi untuk event korporat, perhotelan, dan kebutuhan skala besar lainnya.
                </p>
              </div>

              <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className="w-16 h-16 bg-blue-50 group-hover:bg-blue-600 rounded-2xl flex items-center justify-center mb-8 transition-colors">
                  <TrendingUp size={32} className="text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Perdagangan Umum</h3>
                <p className="text-gray-600 leading-relaxed">
                  Fasilitasi suplai barang dagang komersial dan kebutuhan pokok operasional untuk berbagai skala institusi bisnis menengah ke atas.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Tentang Section */}
        <section id="tentang" className="py-24 bg-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
          <div className="px-6 mx-auto max-w-7xl relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 w-full">
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div className="bg-blue-950 p-8 rounded-2xl text-white transform lg:translate-y-8">
                    <h4 className="text-4xl font-extrabold mb-2">15+</h4>
                    <p className="text-blue-200 font-medium text-sm">Tahun Pengalaman</p>
                  </div>
                  <div className="bg-blue-100 p-8 rounded-2xl">
                    <h4 className="text-4xl font-extrabold text-blue-900 mb-2">100+</h4>
                    <p className="text-blue-700 font-medium text-sm">Mitra UMKM Aktif</p>
                  </div>
                  <div className="bg-gray-50 p-8 rounded-2xl transform lg:translate-y-8 border border-gray-100 shadow-sm">
                    <h4 className="text-4xl font-extrabold text-gray-900 mb-2">50+</h4>
                    <p className="text-gray-600 font-medium text-sm">Hotel Partner</p>
                  </div>
                  <div className="bg-blue-600 p-8 rounded-2xl text-white shadow-lg shadow-blue-600/30">
                    <h4 className="text-4xl font-extrabold mb-2">100%</h4>
                    <p className="text-blue-100 font-medium text-sm">Komitmen Kualitas</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 lg:pl-10">
                <span className="text-blue-600 font-bold tracking-wider uppercase text-sm">Tentang Perusahaan</span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-3 mb-6">Membangun Ekosistem Bisnis yang Saling Menguntungkan</h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                  <strong className="text-blue-900">PT. Ade Mestakung Abadi</strong> didirikan dengan visi untuk mengangkat derajat produk lokal UMKM dengan membukakan pintu ke industri yang lebih besar, khususnya sektor hospitality dan perhotelan.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed mb-8">
                  Melalui sistem manajemen dan quality control yang ketat, kami tidak hanya bertindak sebagai distributor, melainkan inkubator dan partner strategis bagi bisnis lokal untuk memenuhi standar internasional.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-center text-gray-700 font-medium">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 text-blue-700"><ShieldCheck size={14} /></div>
                    Standar Kualitas Tersertifikasi
                  </li>
                  <li className="flex items-center text-gray-700 font-medium">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 text-blue-700"><ShieldCheck size={14} /></div>
                    Layanan Logistik & Pengiriman Cepat
                  </li>
                  <li className="flex items-center text-gray-700 font-medium">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 text-blue-700"><ShieldCheck size={14} /></div>
                    Sistem Pencatatan Penjualan Transparan
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Kontak Section */}
        <section id="kontak" className="py-32 bg-blue-950 text-white relative">
          <div className="px-6 md:px-12 mx-auto max-w-7xl">
            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 md:p-12 lg:p-16 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] relative overflow-hidden">
              <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 justify-between relative z-10">
                <div className="flex-1 max-w-xl">
                  <h2 className="text-3xl md:text-5xl font-extrabold mb-6 text-gray-900 tracking-tight leading-tight">Siap Bermitra <br className="hidden md:block" />Dengan Kami?</h2>
                  <p className="text-gray-600 text-lg mb-12 leading-relaxed">
                    Tertarik menyalurkan produk Anda atau sedang mencari supplier terpercaya untuk bisnis perhotelan Anda? Hubungi tim kami sekarang juga.
                  </p>
                  <div className="space-y-10">
                    <div className="flex items-start group">
                      <div className="bg-blue-50/70 p-5 rounded-2xl mr-6 text-blue-600 shadow-sm border border-blue-100/50 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                        <MapPin size={28} />
                      </div>
                      <div className="mt-1">
                        <h4 className="font-bold text-gray-900 mb-2 text-xl tracking-tight">Kantor Pusat</h4>
                        <p className="text-gray-500 leading-relaxed text-base">Perum Cendana F12 No.11 Batam Centre<br />Batam - Kepulauan Riau</p>
                      </div>
                    </div>
                    <div className="flex items-start group">
                      <div className="bg-blue-50/70 p-5 rounded-2xl mr-6 text-blue-600 shadow-sm border border-blue-100/50 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                        <Phone size={28} />
                      </div>
                      <div className="mt-1">
                        <h4 className="font-bold text-gray-900 mb-2 text-xl tracking-tight">Layanan Telepon</h4>
                        <p className="text-gray-500 leading-relaxed text-base">0819809141<br />082222266400</p>
                      </div>
                    </div>
                    <div className="flex items-start group">
                      <div className="bg-blue-50/70 p-5 rounded-2xl mr-6 text-blue-600 shadow-sm border border-blue-100/50 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                        <Mail size={28} />
                      </div>
                      <div className="mt-1">
                        <h4 className="font-bold text-gray-900 mb-2 text-xl tracking-tight">Alamat Email</h4>
                        <p className="text-gray-500 leading-relaxed text-base">partnership@ademestakung.com</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 w-full max-w-lg lg:max-w-none mx-auto flex items-center">
                  <div className="w-full bg-linear-to-br from-indigo-50/50 to-blue-50/50 rounded-4xl p-10 md:p-14 border border-blue-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-gray-900 flex flex-col justify-center items-center text-center">
                    <h3 className="text-3xl font-bold mb-5 tracking-tight text-blue-950">Konsultasi Kemitraan</h3>
                    <p className="text-gray-600 mb-10 max-w-md text-lg leading-relaxed">
                      Punya pertanyaan, butuh informasi lebih lanjut, atau tertarik menjalin kemitraan strategis dengan kami? Tim kami siap berdiskusi dengan Anda sekarang.
                    </p>
                    <a
                      href="https://wa.me/62819809141?text=Halo%20PT.%20Ade%20Mestakung%20Abadi,%20saya%20ingin%20mendiskusikan%20kerjasama%20penyaluran%20produk."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group w-full md:w-auto inline-flex items-center justify-center gap-4 py-5 px-8 bg-blue-900 text-white text-lg font-bold rounded-2xl shadow-xl shadow-blue-900/20 transition-all duration-300 hover:bg-blue-800 hover:shadow-blue-900/40 hover:-translate-y-1 active:scale-[0.98]"
                    >
                      <svg className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                      Hubungi Kami via WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 pt-16 pb-8 border-t border-slate-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-12">
          {/* Tentang Perusahaan */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center text-blue-950 font-bold text-xl">
                AM
              </div>
              <h2 className="text-2xl font-bold font-sans text-white tracking-tight">PT. Ade Mestakung Abadi</h2>
            </div>
            <p className="text-gray-400 leading-relaxed max-w-sm">
              Perusahaan penyalur dan pusat distribusi resmi produk berkualitas dari mitra UMKM ke industri perhotelan dan horeka di Kepulauan Riau dan sekitarnya.
            </p>
          </div>

          {/* Navigasi */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6 tracking-wide">Navigasi Utama</h3>
            <ul className="space-y-4">
              <li><a href="#beranda" className="hover:text-amber-500 transition-colors inline-block hover:translate-x-1 transform duration-200">Beranda</a></li>
              <li><a href="#layanan" className="hover:text-amber-500 transition-colors inline-block hover:translate-x-1 transform duration-200">Fitur & Layanan</a></li>
              <li><a href="#tentang" className="hover:text-amber-500 transition-colors inline-block hover:translate-x-1 transform duration-200">Tentang Perusahaan</a></li>
              <li><a href="#kontak" className="hover:text-amber-500 transition-colors inline-block hover:translate-x-1 transform duration-200">Pusat Kontak</a></li>
            </ul>
          </div>

          {/* Kontak */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6 tracking-wide">Kontak Kami</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-500 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="leading-relaxed">Perum Cendana F12 No.11 Batam Centre<br />Batam - Kepri</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                <span>0819809141 / 082222266400</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <span>partnership@ademestakung.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-blue-900/50 pt-8 text-center">
          <p className="text-gray-500 text-sm font-medium">
            &copy; {new Date().getFullYear()} PT. Ade Mestakung Abadi. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
