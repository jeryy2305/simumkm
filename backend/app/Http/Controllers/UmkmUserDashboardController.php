<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Consignment;
use App\Models\Product;
use App\Models\ProductRequest;
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

        $produkAktif = Product::where('umkm_id', $umkm->id)
            ->where('status', 'available')
            ->whereDoesntHave('consignments', function ($query) {
                $query->whereIn('status', ['active', 'completed', 'cancelled']);
            })
            ->count();
        $totalTitipan = Consignment::where('umkm_id', $umkm->id)
            ->whereIn('status', ['active', 'completed'])
            ->count() + $produkAktif;
        $selesai = Consignment::where('umkm_id', $umkm->id)->where('status', 'completed')->count();

        $recentConsignments = Consignment::with('product:id,name,category,quantity')
                    ->where('umkm_id', $umkm->id)
                                ->orderBy('created_at', 'desc')
                                ->get();

        $recentProductDeliveries = ProductRequest::where('taken_by_umkm_id', $umkm->id)
                    ->whereNotNull('delivered_to_partner_at')
                    ->orderBy('delivered_to_partner_at', 'desc')
                    ->get();

        $recentCatalogProducts = Product::where('umkm_id', $umkm->id)
                    ->whereDoesntHave('consignments', function ($query) {
                        $query->whereIn('status', ['active', 'completed', 'cancelled']);
                    })
                    ->orderBy('created_at', 'desc')
                    ->get();
        
        $activities = [];
        foreach ($recentConsignments as $c) {
            $distributionStatusLabels = [
                'waiting' => 'Menunggu Distribusi',
                'distributed' => 'Didistribusikan',
                'received' => 'Diterima Hotel',
            ];
            $activities[] = [
                'id' => 'C-' . $c->id,
                'title' => 'Distribusi ke ' . $c->company,
                'status' => $distributionStatusLabels[$c->distribution_status] ?? 'Menunggu Distribusi',
                'date' => ($c->distribution_date ?? $c->created_at)->diffForHumans(),
                'amount' => ($c->quantity ?? 0) . ' ' . ($c->product ? $c->product->name : 'N/A'),
                'type' => 'consignment',
                '_timestamp' => $c->created_at,
            ];
        }

        foreach ($recentProductDeliveries as $productRequest) {
            $hasConsignmentActivity = $recentConsignments->contains(function ($consignment) use ($productRequest) {
                return $consignment->product
                    && mb_strtolower(trim($consignment->product->name)) === mb_strtolower(trim($productRequest->name))
                    && $consignment->product->category === $productRequest->category;
            });

            if ($hasConsignmentActivity) {
                continue;
            }

            $activities[] = [
                'id' => 'PR-' . $productRequest->id,
                'title' => 'Produk masuk ke Mitra',
                'status' => 'Masuk ke Mitra',
                'date' => $productRequest->delivered_to_partner_at->diffForHumans(),
                'amount' => $productRequest->quantity . ' ' . $productRequest->name,
                'type' => 'request',
                '_timestamp' => $productRequest->delivered_to_partner_at,
            ];
        }

        foreach ($recentCatalogProducts as $product) {
            $isDeliveryActivity = $recentProductDeliveries->contains(function ($productRequest) use ($product) {
                return $productRequest->name === $product->name
                    && $productRequest->category === $product->category
                    && (int) $productRequest->quantity === (int) $product->quantity;
            });

            if ($isDeliveryActivity) {
                continue;
            }

            $activities[] = [
                'id' => 'P-' . $product->id,
                'title' => 'Produk masuk ke Mitra',
                'status' => 'Masuk ke Mitra',
                'date' => $product->created_at->diffForHumans(),
                'amount' => $product->quantity . ' ' . $product->name,
                'type' => 'request',
                '_timestamp' => $product->created_at,
            ];
        }

        usort($activities, fn (array $first, array $second) =>
            $second['_timestamp']->getTimestamp() <=> $first['_timestamp']->getTimestamp()
        );
        $activities = array_map(function (array $activity) {
            unset($activity['_timestamp']);
            return $activity;
        }, array_slice($activities, 0, 5));

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

        if ($umkm->status !== 'active') {
            return response()->json([
                'message' => 'Akun UMKM sedang dalam peninjauan.',
                'status' => 'inactive',
            ], 403);
        }

        $products = Product::where('umkm_id', $umkm->id)
            ->select('id', 'name', 'category', 'price', 'hotel_price', 'status', 'quantity', 'umkm_id', 'created_at', 'updated_at')
            ->orderBy('created_at', 'desc')
            ->get();

        $consignmentStatuses = Consignment::whereIn('product_id', $products->pluck('id'))
            ->whereIn('status', ['active', 'cancelled', 'completed'])
            ->get(['product_id', 'status'])
            ->groupBy('product_id');
        
        // Add consignment-driven status info for each product so UI shows correct state
        $productsWithStatus = $products->map(function ($product) use ($consignmentStatuses) {
            $statuses = $consignmentStatuses->get($product->id, collect())->pluck('status');
            $hasActive = $statuses->contains('active');
            $hasCancelled = $statuses->contains('cancelled');
            $hasCompleted = $statuses->contains('completed');

            // Preserve original catalog quantity
            $catalogQty = $product->quantity;

            if ($hasActive || $hasCompleted) {
                $product->ui_status = 'dititipkan';
                $product->quantity = $catalogQty; // show stock for products already dititipkan
                $product->cancelled_quantity = 0;
            } elseif ($hasCancelled) {
                $product->ui_status = 'returned';
                $product->quantity = 0;
                $product->cancelled_quantity = $catalogQty;
            } else {
                $product->ui_status = 'masuk';
                $product->quantity = $catalogQty;
                $product->cancelled_quantity = 0;
            }

            $product->product_status = $product->ui_status === 'dititipkan'
                ? 'Selesai Dititip'
                : ($product->ui_status === 'returned' ? 'Retur / Batal' : 'Masuk ke Mitra');

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
