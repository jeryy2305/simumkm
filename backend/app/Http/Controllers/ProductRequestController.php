<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use App\Models\Consignment;
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

        $umkm = $user->umkm;
        if (!$umkm) {
            return response()->json(['message' => 'UMKM profile not found'], 404);
        }

        $requests = ProductRequest::with('takenByUmkm')
            ->where('status', 'open')
            ->whereNull('taken_by_umkm_id')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($requests);
    }

    public function userHistoryIndex(Request $request)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'umkm') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $umkm = $user->umkm;
        if (!$umkm) {
            return response()->json(['message' => 'UMKM profile not found'], 404);
        }

        $requests = ProductRequest::with('takenByUmkm')
            ->where('taken_by_umkm_id', $umkm->id)
            ->whereIn('status', ['taken', 'completed', 'cancelled'])
            ->orderBy('updated_at', 'desc')
            ->get();

        $requests->each(function (ProductRequest $requestItem) {
            $requestItem->history_status = $this->resolveHistoryStatus($requestItem);
        });

        return response()->json($requests);
    }

    public function history(Request $request, ProductRequest $productRequest)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if ($user->role === 'admin') {
            $productRequest->load('takenByUmkm');
            return response()->json([
                'request' => $productRequest,
                'history' => $this->buildRequestHistory($productRequest),
            ]);
        }

        if ($user->role !== 'umkm') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $umkm = $user->umkm;
        if (!$umkm) {
            return response()->json(['message' => 'UMKM profile not found'], 404);
        }

        if ($productRequest->taken_by_umkm_id !== $umkm->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $productRequest->load('takenByUmkm');

        $productRequest->history_status = $this->resolveHistoryStatus($productRequest);

        return response()->json([
            'request' => $productRequest,
            'history' => $this->buildRequestHistory($productRequest),
            'status_label' => $productRequest->history_status,
        ]);
    }

    private function resolveHistoryStatus(ProductRequest $productRequest): string
    {
        if (!$productRequest->taken_by_umkm_id || $productRequest->status === 'open') {
            return 'Sedang Ditinjau';
        }

        $product = Product::where('umkm_id', $productRequest->taken_by_umkm_id)
            ->where('name', $productRequest->name)
            ->where('category', $productRequest->category)
            ->where('quantity', $productRequest->quantity)
            ->where('price', $productRequest->price_offered)
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$product) {
            return 'Sedang Ditinjau';
        }

        $consignment = Consignment::where('product_id', $product->id)
            ->where('umkm_id', $productRequest->taken_by_umkm_id)
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$consignment) {
            return 'Sedang Ditinjau';
        }

        return match ($consignment->status) {
            'active' => 'Dalam Penyaluran',
            'completed' => 'Selesai Dititip',
            'cancelled' => 'Retur',
            default => 'Sedang Ditinjau',
        };
    }

    private function buildRequestHistory(ProductRequest $productRequest): array
    {
        $history = [[
            'title' => 'Request dibuat',
            'description' => 'Permintaan produk dibuat oleh admin.',
            'timestamp' => $productRequest->created_at?->toIso8601String(),
        ]];

        if ($productRequest->taken_by_umkm_id && in_array($productRequest->status, ['taken', 'completed', 'cancelled'], true)) {
            $history[] = [
                'title' => 'Request diambil',
                'description' => $productRequest->takenByUmkm
                    ? "UMKM {$productRequest->takenByUmkm->name} mengambil request ini."
                    : 'Request ini telah diambil oleh UMKM.',
                'timestamp' => $productRequest->updated_at?->toIso8601String(),
            ];
        }

        if ($productRequest->status === 'completed') {
            $history[] = [
                'title' => 'Request selesai',
                'description' => 'Request telah diselesaikan.',
                'timestamp' => $productRequest->updated_at?->toIso8601String(),
            ];
        } elseif ($productRequest->status === 'cancelled') {
            $history[] = [
                'title' => 'Request dibatalkan',
                'description' => 'Request dibatalkan.',
                'timestamp' => $productRequest->updated_at?->toIso8601String(),
            ];
        }

        return $history;
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
