<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use App\Models\Product;
use App\Models\ProductRequest;

class ProductRequestController extends Controller
{
    public function index()
    {
        return response()->json(ProductRequest::with('takenByUmkm')->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'category' => ['required', Rule::in(['Makanan', 'Minuman', 'Lainnya'])],
            'quantity' => 'required|integer|min:1',
            'reference_price' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'purpose' => 'nullable|string',
        ]);

        $productRequest = ProductRequest::create([
            'name' => $request->name,
            'category' => $request->category,
            'quantity' => $request->quantity,
            'reference_price' => $request->reference_price,
            'description' => $request->description,
            'purpose' => $request->purpose,
            'status' => 'open',
        ]);

        return response()->json($productRequest->load('takenByUmkm'), 201);
    }

    public function show(ProductRequest $productRequest)
    {
        return response()->json($productRequest->load('takenByUmkm'));
    }

    public function update(Request $request, ProductRequest $productRequest)
    {
        $request->validate([
            'name' => 'required|string',
            'category' => ['required', Rule::in(['Makanan', 'Minuman', 'Lainnya'])],
            'quantity' => 'required|integer|min:1',
            'reference_price' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'purpose' => 'nullable|string',
            'status' => ['required', Rule::in(['open', 'taken', 'completed', 'cancelled'])],
        ]);

        $productRequest->update($request->only(['name', 'category', 'quantity', 'reference_price', 'description', 'purpose', 'status']));

        return response()->json($productRequest->load('takenByUmkm'));
    }

    public function destroy(ProductRequest $productRequest)
    {
        $productRequest->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function userIndex(Request $request)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'umkm') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $requests = ProductRequest::with('takenByUmkm')
            ->where('status', 'open')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($requests);
    }

    public function take(Request $request, ProductRequest $productRequest)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'umkm') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $umkm = $user->umkm;
        if (!$umkm) {
            return response()->json(['message' => 'UMKM profile not found'], 404);
        }

        if ($productRequest->status !== 'open') {
            return response()->json(['message' => 'Request sudah tidak tersedia'], 422);
        }

        $request->validate([
            'price_offered' => 'required|numeric|min:0',
        ]);

        $productRequest->update([
            'status' => 'taken',
            'taken_by_umkm_id' => $umkm->id,
            'price_offered' => $request->price_offered,
        ]);

        $product = Product::create([
            'name' => $productRequest->name,
            'category' => $productRequest->category,
            'price' => $request->price_offered,
            'quantity' => $productRequest->quantity,
            'status' => 'available',
            'umkm_id' => $umkm->id,
        ]);

        return response()->json([
            'request' => $productRequest->load('takenByUmkm'),
            'product' => $product,
        ]);
    }
}
