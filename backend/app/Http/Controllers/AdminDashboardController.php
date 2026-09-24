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
        $barangMasukHariIni = Consignment::whereIn('consignments.distribution_status', ['waiting', 'distributed'])
            ->join('products', 'consignments.product_id', '=', 'products.id')
            ->join('umkms', 'consignments.umkm_id', '=', 'umkms.id')
            ->where('umkms.status', 'active')
            ->sum('consignments.quantity');

        $totalNilaiDistribusi = Consignment::query()
            ->join('products', 'consignments.product_id', '=', 'products.id')
            ->join('umkms', 'consignments.umkm_id', '=', 'umkms.id')
            ->where('consignments.distribution_status', 'received')
            ->where('umkms.status', 'active')
            ->selectRaw('COALESCE(SUM(consignments.quantity * products.price), 0) as total')
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
                    'waiting' => 'Menunggu Distribusi',
                    'distributed' => 'Didistribusikan',
                    'received' => 'Diterima Hotel',
                ];
                $distributionStatus = $consignment->distribution_status
                    ?? ($consignment->status === 'completed' ? 'received' : 'waiting');
                return [
                    'date' => ($consignment->distribution_date ?? $consignment->start_date ?? $consignment->created_at)->format('d M Y'),
                    'type' => $statusMap[$distributionStatus] ?? 'Unknown',
                    'partner' => $consignment->company,
                    'product' => $consignment->product ? $consignment->product->name : 'Produk Terhapus',
                    'qty' => $consignment->quantity ?? 0,
                    'status' => $statusMap[$distributionStatus] ?? 'Unknown',
                ];
            });

        return response()->json($activities);
    }
}