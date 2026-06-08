<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;

class ProductController extends Controller
{
    public function index()
    {
        return response()->json(Product::with('umkm')->orderBy('created_at', 'desc')->get());
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
