<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Consignment;
use App\Services\AppNotificationService;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::with('umkm', 'consignments')->orderBy('created_at', 'desc')->get();

        $completedProductIds = Consignment::whereIn('product_id', $products->pluck('id'))
            ->where('status', 'completed')
            ->pluck('product_id')
            ->flip();

        $products->each(function ($product) use ($completedProductIds) {
            $product->has_completed_consignment = $completedProductIds->has($product->id);
            $hasConsignment = $product->consignments->contains(fn ($consignment) => in_array($consignment->status, ['active', 'completed'], true));
            $product->product_status = $hasConsignment ? 'Selesai Dititip' : ($product->consignments->contains('status', 'cancelled') ? 'Retur / Batal' : 'Masuk ke Mitra');
        });

        return response()->json($products);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required',
            'category' => 'required|in:Makanan,Minuman,Lainnya',
            'price' => 'required|numeric',
            'partner_profit' => 'nullable|numeric|min:0',
            'hotel_price' => 'nullable|numeric|min:0',
            'quantity' => 'required|integer|min:0',
            'status' => 'required|in:available,unavailable',
            'umkm_id' => 'required|exists:umkms,id',
        ]);

        $payload = $request->all();
        $payload['partner_profit'] = $request->input('partner_profit', 0);
        $payload['hotel_price'] = $request->input('hotel_price', (float) $request->price + (float) $payload['partner_profit']);
        $product = Product::create($payload);
        $product->load('umkm');
        if ($product->umkm?->user_id) {
            AppNotificationService::notifyUser($product->umkm->user_id, 'Produk diperbarui', "Produk {$product->name} ditambahkan ke katalog.", '/umkm/produk');
        }
        return response()->json($product, 201);
    }

    public function show(Product $product)
    {
        return response()->json($product->load('umkm', 'consignments'));
    }

    public function update(Request $request, Product $product)
    {
        // Prevent update if the product has a completed consignment (status "Keluar")
        $hasCompletedConsignment = Consignment::where('product_id', $product->id)
            ->where('status', 'completed')
            ->exists();

        if ($hasCompletedConsignment) {
            return response()->json([
                'message' => 'Produk tidak dapat diubah karena sudah memiliki data penitipan berstatus Keluar.'
            ], 403);
        }

        $request->validate([
            'name' => 'required',
            'category' => 'required|in:Makanan,Minuman,Lainnya',
            'price' => 'required|numeric',
            'partner_profit' => 'nullable|numeric|min:0',
            'hotel_price' => 'nullable|numeric|min:0',
            'quantity' => 'required|integer|min:0',
            'status' => 'required|in:available,unavailable',
            'umkm_id' => 'required|exists:umkms,id',
        ]);

        $payload = $request->all();
        $payload['partner_profit'] = $request->input('partner_profit', 0);
        $payload['hotel_price'] = $request->input('hotel_price', (float) $request->price + (float) $payload['partner_profit']);
        $product->update($payload);
        $product->load('umkm');
        if ($product->umkm?->user_id) {
            AppNotificationService::notifyUser($product->umkm->user_id, 'Produk diperbarui', "Data produk {$product->name} diperbarui oleh Admin.", '/umkm/produk');
        }
        return response()->json($product);
    }

    public function destroy(Product $product)
    {
        $product->load('umkm');
        $userId = $product->umkm?->user_id;
        $productName = $product->name;
        $product->delete();
        if ($userId) {
            AppNotificationService::notifyUser($userId, 'Produk dihapus', "Produk {$productName} dihapus dari katalog oleh Admin.", '/umkm/produk');
        }
        return response()->json(['message' => 'Deleted']);
    }
}
