<?php

namespace App\Http\Controllers;

use App\Models\Umkm;
use App\Models\Product;
use App\Models\Consignment;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AdminDashboardController extends Controller
{
    public function stats()
    {
        $totalUmkm = Umkm::where('status', 'active')->count();
        $totalProducts = Product::whereHas('umkm', function ($query) {
            $query->where('status', 'active');
        })->count();
        $barangMasukHariIni = Consignment::where('status', 'active')
            ->whereHas('umkm', function ($query) {
                $query->where('status', 'active');
            })
            ->sum('quantity');
        $totalNilaiDistribusi = Consignment::with('product')
            ->where('status', 'completed')
            ->whereHas('umkm', function ($query) {
                $query->where('status', 'active');
            })
            ->get()
            ->sum(function ($consignment) {
                return $consignment->quantity * $consignment->product->price;
            });

        return response()->json([
            'total_umkm' => $totalUmkm,
            'total_products' => $totalProducts,
            'barang_masuk_hari_ini' => $barangMasukHariIni,
            'total_nilai_distribusi' => $totalNilaiDistribusi,
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
                    'product' => $consignment->product->name,
                    'qty' => $consignment->quantity,
                    'status' => $statusMap[$consignment->status] ?? 'Unknown',
                ];
            });

        return response()->json($activities);
    }
}