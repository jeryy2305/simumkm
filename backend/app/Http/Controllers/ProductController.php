<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Consignment;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::with('umkm')->orderBy('created_at', 'desc')->get();

        // Append flag indicating whether the product has a completed consignment ("Keluar")
        $products->each(function ($product) {
            $product->has_completed_consignment = Consignment::where('product_id', $product->id)
                ->where('status', 'completed')
                ->exists();
        });

        return response()->json($products);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required',
            'category' => 'required|in:Makanan,Minuman,Lainnya',
            'price' => 'required|numeric',
            'quantity' => 'required|integer|min:0',
            'status' => 'required|in:available,unavailable',
            'umkm_id' => 'required|exists:umkms,id',
        ]);

        $product = Product::create($request->all());
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
            'quantity' => 'required|integer|min:0',
            'status' => 'required|in:available,unavailable',
            'umkm_id' => 'required|exists:umkms,id',
        ]);

        $product->update($request->all());
        return response()->json($product);
    }

    public function destroy(Product $product)
    {
        $product->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
