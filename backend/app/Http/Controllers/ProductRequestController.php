<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use App\Models\Consignment;
use App\Models\Product;
use App\Models\ProductRequest;
use App\Models\ProductRequestOffer;
use Illuminate\Support\Facades\DB;

class ProductRequestController extends Controller
{
    public function index()
    {
        return response()->json(ProductRequest::with(['takenByUmkm', 'offers.umkm'])->orderBy('created_at', 'desc')->get());
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
            'status' => ['required', Rule::in(['open', 'pending_approval', 'taken', 'completed', 'cancelled'])],
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

        $requests = ProductRequest::with(['takenByUmkm', 'offers.umkm'])
            ->where(function ($query) {
                $query->where('status', 'open')
                    ->orWhere('status', 'pending_approval')
                    ->orWhere(function ($approved) {
                        $approved->where('status', 'taken')
                            ->where('updated_at', '>=', now()->subDay());
                    });
            })
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

        $requests = ProductRequest::with(['takenByUmkm', 'offers.umkm'])
            ->where(function ($query) use ($umkm) {
                $query->where('taken_by_umkm_id', $umkm->id)
                    ->orWhereHas('offers', fn ($offers) => $offers->where('umkm_id', $umkm->id));
            })
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
            $productRequest->load(['takenByUmkm', 'offers.umkm']);
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

        if ($productRequest->taken_by_umkm_id !== $umkm->id && !$productRequest->offers()->where('umkm_id', $umkm->id)->exists()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $productRequest->load(['takenByUmkm', 'offers.umkm']);

        $productRequest->history_status = $this->resolveHistoryStatus($productRequest);

        return response()->json([
            'request' => $productRequest,
            'history' => $this->buildRequestHistory($productRequest),
            'status_label' => $productRequest->history_status,
        ]);
    }

    private function resolveHistoryStatus(ProductRequest $productRequest): string
    {
        if ($productRequest->status === 'pending_approval') {
            return 'Menunggu Persetujuan';
        }

        if (!$productRequest->taken_by_umkm_id || $productRequest->status === 'open') {
            return 'Terbuka';
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

        foreach ($productRequest->offers as $offer) {
            $history[] = [
                'title' => 'Pengajuan harga',
                'description' => sprintf(
                    '%s mengajukan harga Rp %s (%s).',
                    $offer->umkm?->name ?? 'UMKM',
                    number_format((float) $offer->price_offered, 0, ',', '.'),
                    $offer->status === 'rejected' ? 'ditolak, menjadi referensi' : ($offer->status === 'approved' ? 'disetujui' : 'menunggu persetujuan')
                ),
                'timestamp' => $offer->created_at?->toIso8601String(),
            ];
        }

        if ($productRequest->status === 'pending_approval') {
            $history[] = [
                'title' => 'Harga diajukan',
                'description' => 'UMKM mengajukan harga dan menunggu persetujuan admin.',
                'timestamp' => $productRequest->updated_at?->toIso8601String(),
            ];
        }

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

        $request->validate([
            'price_offered' => 'required|numeric|min:0',
        ]);

        if ($productRequest->status !== 'open') {
            if ($productRequest->status === 'pending_approval' && (int) $productRequest->taken_by_umkm_id === (int) $umkm->id) {
                $offer = $productRequest->offers()
                    ->where('umkm_id', $umkm->id)
                    ->where('status', 'pending')
                    ->latest('id')
                    ->first();

                if ($offer) {
                    $offer->update(['price_offered' => $request->price_offered]);
                    $productRequest->update(['price_offered' => $request->price_offered]);

                    return response()->json([
                        'request' => $productRequest->fresh()->load(['takenByUmkm', 'offers.umkm']),
                        'offer' => $offer->fresh()->load('umkm'),
                    ]);
                }
            }

            return response()->json(['message' => 'Request sudah tidak tersedia'], 422);
        }

        [$offer, $productRequest] = DB::transaction(function () use ($productRequest, $umkm, $request) {
            $offer = ProductRequestOffer::create([
                'product_request_id' => $productRequest->id,
                'umkm_id' => $umkm->id,
                'price_offered' => $request->price_offered,
                'status' => 'pending',
            ]);

            $productRequest->update([
                'status' => 'pending_approval',
                'taken_by_umkm_id' => $umkm->id,
                'price_offered' => $request->price_offered,
            ]);

            return [$offer, $productRequest];
        });

        return response()->json([
            'request' => $productRequest->load(['takenByUmkm', 'offers.umkm']),
            'offer' => $offer->load('umkm'),
        ]);
    }

    public function approve(ProductRequest $productRequest)
    {
        if (Auth::user()?->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($productRequest->status !== 'pending_approval' || !$productRequest->taken_by_umkm_id) {
            return response()->json(['message' => 'Request tidak sedang menunggu persetujuan'], 422);
        }

        $product = DB::transaction(function () use ($productRequest) {
            $productRequest->offers()->where('status', 'pending')->update(['status' => 'approved']);
            $productRequest->update(['status' => 'taken']);

            return Product::create([
                'name' => $productRequest->name,
                'category' => $productRequest->category,
                'price' => $productRequest->price_offered,
                'quantity' => $productRequest->quantity,
                'status' => 'available',
                'umkm_id' => $productRequest->taken_by_umkm_id,
            ]);
        });

        return response()->json(['request' => $productRequest->fresh()->load(['takenByUmkm', 'offers.umkm']), 'product' => $product]);
    }

    public function reject(ProductRequest $productRequest)
    {
        if (Auth::user()?->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($productRequest->status !== 'pending_approval') {
            return response()->json(['message' => 'Request tidak sedang menunggu persetujuan'], 422);
        }

        $productRequest->offers()->where('status', 'pending')->update(['status' => 'rejected']);
        $productRequest->update([
            'status' => 'open',
            'taken_by_umkm_id' => null,
            'price_offered' => null,
        ]);

        return response()->json(['request' => $productRequest->fresh()->load(['takenByUmkm', 'offers.umkm'])]);
    }
}
