<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Consignment;
use App\Models\Product;
use App\Models\Umkm;
use App\Models\ProductRequest;
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
        $activeRequestsCount = ProductRequest::where('status', 'open')->count();

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
            'recent_activities' => $activities,
            'active_requests_count' => $activeRequestsCount
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

        $products = Product::where('umkm_id', $umkm->id)
            ->select('id', 'name', 'category', 'price', 'status', 'quantity', 'umkm_id', 'created_at', 'updated_at')
            ->orderBy('created_at', 'desc')
            ->get();
        
        // Add consignment-driven status info for each product so UI shows correct state
        $productsWithStatus = $products->map(function ($product) {
            $hasActive = Consignment::where('product_id', $product->id)
                ->where('status', 'active')
                ->exists();

            $hasCancelled = Consignment::where('product_id', $product->id)
                ->where('status', 'cancelled')
                ->exists();

            $hasCompleted = Consignment::where('product_id', $product->id)
                ->where('status', 'completed')
                ->exists();

            // Preserve original catalog quantity
            $catalogQty = $product->quantity;

            // For UI: if there's an active consignment, show the product as "in_transit" regardless of product.status
            if ($hasActive) {
                $product->ui_status = 'in_transit';
                $product->quantity = $catalogQty; // show stock for products already dititipkan
                $product->cancelled_quantity = 0;
            } elseif ($hasCancelled) {
                $product->ui_status = 'returned';
                $product->quantity = 0;
                $product->cancelled_quantity = $catalogQty;
            } elseif ($hasCompleted) {
                $product->ui_status = 'ready';
                $product->quantity = $catalogQty;
                $product->cancelled_quantity = 0;
            } else {
                // No active/finished consignments — product still in catalog input/review stage.
                $product->ui_status = 'pending_review';
                $product->quantity = $catalogQty;
                $product->cancelled_quantity = 0;
            }

            // Include original catalog quantity for reference
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

        $consignments = Consignment::with('product')->where('umkm_id', $umkm->id)->orderBy('created_at', 'desc')->get();
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
