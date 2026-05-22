<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Consignment;
use App\Models\Product;
use App\Models\Umkm;
use Illuminate\Support\Facades\Auth;

class UmkmUserDashboardController extends Controller
{
    /**
     * Get dashboard stats for the authenticated UMKM user.
     * If not using auth yet, we can pass umkm_id for testing.
     */
    public function dashboard(Request $request)
    {
        $user = Auth::user();

        if (!$user || $user->role !== 'umkm') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $umkm = $user->umkm;

        if (!$umkm) {
            return response()->json(['message' => 'UMKM profile not found'], 404);
        }

        $totalTitipan = Consignment::where('umkm_id', $umkm->id)->count();
        $produkAktif = Product::where('umkm_id', $umkm->id)->where('status', 'available')->count();
        $selesai = Consignment::where('umkm_id', $umkm->id)->where('status', 'completed')->count();

        $recentConsignments = Consignment::where('umkm_id', $umkm->id)
                                ->orderBy('created_at', 'desc')
                                ->take(5)
                                ->get();
        
        $activities = [];
        foreach ($recentConsignments as $c) {
            $activities[] = [
                'id' => 'C-' . $c->id,
                'title' => 'Penitipan ' . $c->company,
                'status' => $c->status === 'completed' ? 'Selesai' : ($c->status === 'active' ? 'Proses' : 'Batal'),
                'date' => $c->created_at->diffForHumans(),
                'amount' => ($c->product ? $c->product->quantity : 0) . ' ' . ($c->product ? $c->product->name : 'N/A'),
                'type' => 'consignment'
            ];
        }

        return response()->json([
            'umkm' => $umkm,
            'stats' => [
                'total_titipan' => $totalTitipan,
                'produk_aktif' => $produkAktif,
                'selesai' => $selesai,
            ],
            'recent_activities' => $activities
        ]);
    }
    
    public function products(Request $request)
    {
        $user = Auth::user();

        if (!$user || $user->role !== 'umkm') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $umkm = $user->umkm;
        if (!$umkm) {
            return response()->json(['message' => 'UMKM profile not found'], 404);
        }

        $products = Product::where('umkm_id', $umkm->id)->get();
        
        // Add consignment status info for each product
        $productsWithStatus = $products->map(function ($product) {
            $hasActive = Consignment::where('product_id', $product->id)
                ->where('status', 'active')
                ->exists();
            
            $hasCancelled = Consignment::where('product_id', $product->id)
                ->where('status', 'cancelled')
                ->exists();
            
            // Simpan stok katalog asli
            $catalogQty = $product->quantity;
            
            // Untuk kebutuhan UI: tampilkan stok katalog jika sedang aktif/retur, agar badge status sesuai
            $product->quantity = $hasActive ? $catalogQty : 0;
            $product->cancelled_quantity = $hasCancelled ? $catalogQty : 0;
            
            // Sertakan juga stok asli jika diperlukan di masa depan
            $product->catalog_quantity = $catalogQty;
            
            return $product;
        });

        return response()->json($productsWithStatus);
    }
    
    public function consignments(Request $request)
    {
        $user = Auth::user();

        if (!$user || $user->role !== 'umkm') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $umkm = $user->umkm;
        if (!$umkm) {
            return response()->json(['message' => 'UMKM profile not found'], 404);
        }

        $consignments = Consignment::with('product')->where('umkm_id', $umkm->id)->get();
        return response()->json($consignments);
    }

    public function index()
    {
        $user = Auth::user();

        if (!$user || $user->role !== 'umkm') {
            return redirect('/')->with('error', 'Unauthorized');
        }

        $umkm = $user->umkm;

        if (!$umkm) {
            return redirect('/')->with('error', 'UMKM profile not found');
        }

        $totalTitipan = Consignment::where('umkm_id', $umkm->id)->count();
        $produkAktif = Product::where('umkm_id', $umkm->id)->where('status', 'available')->count();
        $selesai = Consignment::where('umkm_id', $umkm->id)->where('status', 'completed')->count();

        $recentConsignments = Consignment::with('product')->where('umkm_id', $umkm->id)
                                ->orderBy('created_at', 'desc')
                                ->take(5)
                                ->get();
        
        $activities = [];
        foreach ($recentConsignments as $c) {
            $activities[] = [
                'id' => 'C-' . $c->id,
                'title' => 'Penitipan ' . $c->company,
                'status' => $c->status === 'completed' ? 'Selesai' : ($c->status === 'active' ? 'Proses' : 'Batal'),
                'date' => $c->created_at->diffForHumans(),
                'amount' => ($c->product ? $c->product->quantity : 0) . ' ' . ($c->product ? $c->product->name : 'N/A'),
                'type' => 'consignment'
            ];
        }

        return view('umkm-dashboard', compact('totalTitipan', 'produkAktif', 'selesai', 'activities'));
    }
}
