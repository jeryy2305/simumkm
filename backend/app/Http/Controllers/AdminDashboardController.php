<?php

namespace App\Http\Controllers;

use App\Models\Umkm;
use App\Models\Product;
use App\Models\Consignment;

class AdminDashboardController extends Controller
{
    public function stats()
    {
        $totalUmkm = Umkm::where('status', 'active')->count();
        $totalProducts = Product::whereHas('umkm', function ($query) {
            $query->where('status', 'active');
        })->count();
        $barangMasukHariIni = Consignment::where('consignments.status', 'active')
            ->join('products', 'consignments.product_id', '=', 'products.id')
            ->join('umkms', 'consignments.umkm_id', '=', 'umkms.id')
            ->where('umkms.status', 'active')
            ->sum('products.quantity');

        $totalNilaiDistribusi = Consignment::query()
            ->join('products', 'consignments.product_id', '=', 'products.id')
            ->join('umkms', 'consignments.umkm_id', '=', 'umkms.id')
            ->where('consignments.status', 'completed')
            ->where('umkms.status', 'active')
            ->selectRaw('COALESCE(SUM(products.quantity * products.price), 0) as total')
            ->value('total');

        return response()->json([
            'total_umkm' => $totalUmkm,
            'total_products' => $totalProducts,
            'barang_masuk_hari_ini' => $barangMasukHariIni,
            'total_nilai_distribusi' => (float) $totalNilaiDistribusi,
        ]);
    }

    public function activities()
    {
        $activities = Consignment::with(['umkm', 'product'])
            ->whereHas('umkm', function ($query) {
                $query->where('status', 'active');
            })
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->map(function ($consignment) {
                $statusMap = [
                    'active' => 'Masuk',
                    'completed' => 'Keluar',
                    'cancelled' => 'Retur',
                ];
                return [
                    'date' => $consignment->created_at->format('d M Y'),
                    'type' => $statusMap[$consignment->status] ?? 'Unknown',
                    'partner' => $consignment->company,
                    'product' => $consignment->product ? $consignment->product->name : 'Produk Terhapus',
                    'qty' => $consignment->product ? $consignment->product->quantity : 0,
                    'status' => $statusMap[$consignment->status] ?? 'Unknown',
                ];
            });

        return response()->json($activities);
    }
}