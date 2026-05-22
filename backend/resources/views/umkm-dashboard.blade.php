@extends('layouts.app')

@section('content')
<div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">Dashboard UMKM</h1>

    <!-- Konten dashboard UMKM di sini -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white p-6 rounded-lg shadow-md">
            <h2 class="text-xl font-semibold mb-2">Total Titipan</h2>
            <p class="text-2xl font-bold text-blue-600">{{ $totalTitipan ?? 0 }}</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-md">
            <h2 class="text-xl font-semibold mb-2">Produk Aktif</h2>
            <p class="text-2xl font-bold text-green-600">{{ $produkAktif ?? 0 }}</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-md">
            <h2 class="text-xl font-semibold mb-2">Titipan Selesai</h2>
            <p class="text-2xl font-bold text-purple-600">{{ $selesai ?? 0 }}</p>
        </div>
    </div>

    <!-- Aktivitas Terbaru -->
    <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold mb-4">Aktivitas Terbaru</h2>
        @if(isset($activities) && count($activities) > 0)
            <ul class="space-y-3">
                @foreach($activities as $activity)
                    <li class="flex justify-between items-center border-b pb-2">
                        <div>
                            <p class="font-medium">{{ $activity['title'] }}</p>
                            <p class="text-sm text-gray-600">{{ $activity['amount'] }} - {{ $activity['status'] }}</p>
                        </div>
                        <span class="text-sm text-gray-500">{{ $activity['date'] }}</span>
                    </li>
                @endforeach
            </ul>
        @else
            <p class="text-gray-500">Belum ada aktivitas.</p>
        @endif
    </div>
</div>

<!-- Floating WhatsApp Button -->
<div id="whatsapp-float" class="fixed bottom-4 right-4 z-50">
    <a href="https://wa.me/628123456789?text=Halo%20saya%20ingin%20bertanya%20tentang%20UMKM%20Anda"
       target="_blank"
       class="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center">
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
        </svg>
    </a>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const whatsappFloat = document.getElementById('whatsapp-float');
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let initialX = 0;
    let initialY = 0;

    whatsappFloat.addEventListener('mousedown', function(e) {
        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        const rect = whatsappFloat.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;
        whatsappFloat.style.cursor = 'grabbing';
        e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;

        const deltaX = e.clientX - dragStartX;
        const deltaY = e.clientY - dragStartY;

        const newX = initialX + deltaX;
        const newY = initialY + deltaY;

        // Batasi agar tidak keluar dari viewport
        const maxX = window.innerWidth - whatsappFloat.offsetWidth;
        const maxY = window.innerHeight - whatsappFloat.offsetHeight;

        whatsappFloat.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
        whatsappFloat.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
        whatsappFloat.style.right = 'auto';
        whatsappFloat.style.bottom = 'auto';
    });

    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            whatsappFloat.style.cursor = 'grab';
        }
    });

    // Set initial position
    whatsappFloat.style.position = 'fixed';
    whatsappFloat.style.bottom = '1rem';
    whatsappFloat.style.right = '1rem';
    whatsappFloat.style.cursor = 'grab';
});
</script>
@endsection