<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use App\Models\Consignment;
use App\Models\Product;
use App\Models\ProductRequest;
use App\Models\ProductRequestOffer;
use App\Services\AppNotificationService;
use Illuminate\Support\Facades\DB;

class ProductRequestController extends Controller
{
    public function index()
    {
        $requests = ProductRequest::with(['takenByUmkm', 'offers.umkm'])->orderBy('created_at', 'desc')->get();
        $this->expireUnclaimedRequests($requests);
        if (Auth::user()?->role !== 'admin') {
            $requests->each(fn (ProductRequest $requestItem) => $requestItem->makeHidden(['partner_profit']));
        }

        return response()->json($requests);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'category' => ['required', Rule::in(['Makanan', 'Minuman', 'Lainnya'])],
            'quantity' => 'required|integer|min:1',
            'reference_price' => 'required|numeric|min:0',
            'partner_profit' => 'required|numeric|min:0',
            'hotel_departure_date' => 'required|date',
            'description' => 'nullable|string',
            'purpose' => 'nullable|string',
        ]);

        $productRequest = ProductRequest::create([
            'name' => $request->name,
            'category' => $request->category,
            'quantity' => $request->quantity,
            'reference_price' => $request->reference_price,
            'partner_profit' => $request->partner_profit,
            'hotel_departure_date' => $request->hotel_departure_date,
            'description' => $request->description,
            'purpose' => $request->purpose,
            'status' => 'open',
            'participation_deadline' => now()->addDay(),
        ]);

        AppNotificationService::notifyUmkms(
            'Request produk baru',
            "Admin membuat request produk {$productRequest->name}.",
            "/umkm/request-produk?id={$productRequest->id}"
        );

        return response()->json($productRequest->load('takenByUmkm'), 201);
    }

    public function show(ProductRequest $productRequest)
    {
        $productRequest->load(['takenByUmkm', 'offers.umkm']);
        $productRequest->history_status = $this->resolveHistoryStatus($productRequest);
        if (Auth::user()?->role !== 'admin') {
            $productRequest->makeHidden(['partner_profit']);
        }

        return response()->json($productRequest);
    }

    public function update(Request $request, ProductRequest $productRequest)
    {
        $request->validate([
            'name' => 'required|string',
            'category' => ['required', Rule::in(['Makanan', 'Minuman', 'Lainnya'])],
            'quantity' => 'required|integer|min:1',
            'reference_price' => 'nullable|numeric|min:0',
            'partner_profit' => 'nullable|numeric|min:0',
            'hotel_departure_date' => 'nullable|date',
            'description' => 'nullable|string',
            'purpose' => 'nullable|string',
            'status' => ['required', Rule::in(['open', 'pending_approval', 'taken', 'completed', 'cancelled'])],
        ]);

        $productRequest->update($request->only([
            'name', 'category', 'quantity', 'reference_price', 'partner_profit',
            'hotel_departure_date', 'description', 'purpose', 'status',
        ]));

        if (Auth::user()?->role === 'admin') {
            AppNotificationService::notifyUmkms(
                'Request produk diperbarui',
                "Data request {$productRequest->name} diperbarui oleh Admin.",
                "/umkm/request-produk?id={$productRequest->id}"
            );
        }

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
                        })
                        ->orWhere(function ($expired) {
                            $expired->where('status', 'expired')
                                ->where('updated_at', '>=', now()->subDay());
                            })
                            ->orWhere(function ($unfulfilled) {
                                $unfulfilled->where('status', 'unfulfilled')
                                    ->where('updated_at', '>=', now()->subDay());
                            })
                            ->orWhere(function ($fulfilled) {
                                $fulfilled->where('status', 'fulfilled')
                                    ->where('updated_at', '>=', now()->subDay());
                            });
            })
            ->orderBy('created_at', 'desc')
            ->get();
        $this->expireUnclaimedRequests($requests);

        $requests->each(function (ProductRequest $requestItem) use ($umkm) {
            $requestItem->offer_status = $requestItem->offers
                ->where('umkm_id', $umkm->id)
                ->sortByDesc('id')
                ->first()?->status;
            $requestItem->approval_notice = $requestItem->offer_status === 'approved'
                ? 'Produk disetujui dan sudah masuk ke mitra.'
                : null;
            $requestItem->makeHidden(['partner_profit']);
        });

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
            ->orderBy('created_at', 'desc')
            ->get();

        $requests->each(function (ProductRequest $requestItem) use ($umkm) {
            $offer = $requestItem->offers
                ->where('umkm_id', $umkm->id)
                ->sortByDesc('id')
                ->first();
            $requestItem->offer_status = $offer?->status;
            $requestItem->history_sort_at = $offer?->created_at?->toIso8601String() ?? $requestItem->created_at?->toIso8601String();
            $requestItem->history_status = match ($requestItem->offer_status) {
                'approved' => 'Masuk ke Mitra',
                'rejected' => 'Ditolak',
                'pending' => 'Menunggu Tester',
                default => $this->resolveHistoryStatus($requestItem),
            };
            $requestItem->approval_notice = null;
            $requestItem->makeHidden(['partner_profit']);
        });

        $requests = $requests->sortByDesc('history_sort_at')->values();

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

        $productRequest->offer_status = $productRequest->offers
            ->where('umkm_id', $umkm->id)
            ->sortByDesc('id')
            ->first()?->status;
        $productRequest->history_status = match ($productRequest->offer_status) {
            'approved' => 'Masuk ke Mitra',
            'rejected' => 'Ditolak',
            'pending' => 'Menunggu Tester',
            default => $this->resolveHistoryStatus($productRequest),
        };
        $productRequest->approval_notice = null;
        $productRequest->makeHidden(['partner_profit']);

        return response()->json([
            'request' => $productRequest,
            'history' => $this->buildRequestHistory($productRequest, $umkm->id),
            'status_label' => $productRequest->history_status,
        ]);
    }

    private function resolveHistoryStatus(ProductRequest $productRequest): string
    {
        if ($productRequest->status === 'fulfilled') {
            return 'Masuk ke Mitra';
        }

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
            return $productRequest->delivered_to_partner_at ? 'Masuk ke Mitra' : 'Sedang Diproses';
        }

        $consignment = Consignment::where('product_id', $product->id)
            ->where('umkm_id', $productRequest->taken_by_umkm_id)
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$consignment) {
            return $productRequest->delivered_to_partner_at ? 'Masuk ke Mitra' : 'Sedang Diproses';
        }

        if ($consignment->status === 'completed') {
            return 'Selesai Dititip';
        }

        if ($consignment->status === 'cancelled') {
            return 'Retur';
        }

        return match ($consignment->status) {
            'active' => 'Masuk ke Mitra',
            default => 'Sedang Ditinjau',
        };
    }

    private function buildRequestHistory(ProductRequest $productRequest, ?int $umkmId = null): array
    {
        $history = [[
            'title' => 'Request dibuat',
            'description' => 'Permintaan produk dibuat oleh admin.',
            'timestamp' => $productRequest->created_at?->toIso8601String(),
        ]];

        foreach ($productRequest->offers as $offer) {
            if ($umkmId !== null && (int) $offer->umkm_id !== $umkmId) {
                continue;
            }

            $history[] = [
                'title' => 'Tester disiapkan',
                'description' => sprintf(
                    '%s mendaftarkan diri sebagai penyedia Tester (%s).',
                    $offer->umkm?->name ?? 'UMKM',
                    $offer->status === 'rejected' ? 'ditolak' : ($offer->status === 'approved' ? 'disetujui dan masuk ke mitra' : 'menunggu tester')
                ),
                'timestamp' => $offer->created_at?->toIso8601String(),
            ];
        }

        if ($productRequest->rejection_reason) {
            $history[] = [
                'title' => 'Pengajuan ditolak',
                'description' => 'Alasan Admin: ' . $productRequest->rejection_reason,
                'timestamp' => $productRequest->updated_at?->toIso8601String(),
            ];
        }

        if ($umkmId === null && $productRequest->status === 'pending_approval') {
            $history[] = [
            'title' => 'Menunggu Tester',
            'description' => 'Peserta tester menunggu penilaian Admin.',
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
        ]);

        if ($productRequest->participation_deadline && now()->greaterThan($productRequest->participation_deadline)) {
            $this->expireUnclaimedRequests(collect([$productRequest]));
        }

        if ($productRequest->status !== 'open') {
            return response()->json(['message' => 'Periode pengambilan request sudah berakhir'], 422);
        }

        if ($productRequest->offers()->where('umkm_id', $umkm->id)->exists()) {
            return response()->json(['message' => 'UMKM sudah terdaftar sebagai peserta tester'], 422);
        }

        [$offer, $productRequest] = DB::transaction(function () use ($productRequest, $umkm, $request) {
            $offer = ProductRequestOffer::create([
                'product_request_id' => $productRequest->id,
                'umkm_id' => $umkm->id,
                'price_offered' => $productRequest->reference_price,
                'quantity_offered' => $productRequest->quantity,
                'status' => 'pending',
            ]);

            return [$offer, $productRequest];
        });

        return response()->json([
            'request' => $productRequest->load(['takenByUmkm', 'offers.umkm']),
            'offer' => $offer->load('umkm'),
        ]);
    }

    public function approveOffer(ProductRequest $productRequest, ProductRequestOffer $offer)
    {
        if (Auth::user()?->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($offer->product_request_id !== $productRequest->id || !in_array($productRequest->status, ['open', 'pending_approval'], true) || $offer->status !== 'pending') {
            return response()->json(['message' => 'Peserta tester tidak dapat diproses'], 422);
        }

        DB::transaction(function () use ($productRequest, $offer) {
            $lockedRequest = ProductRequest::whereKey($productRequest->id)->lockForUpdate()->firstOrFail();
            $lockedOffer = ProductRequestOffer::whereKey($offer->id)->lockForUpdate()->firstOrFail();

            if (!in_array($lockedRequest->status, ['open', 'pending_approval'], true) || $lockedOffer->status !== 'pending') {
                abort(422, 'Peserta tester sudah diproses atau request sudah memiliki peserta terpilih');
            }

            $lockedOffer->update(['status' => 'approved']);
            $lockedRequest->offers()->where('id', '!=', $lockedOffer->id)->whereIn('status', ['pending', 'approved'])->update(['status' => 'rejected']);
            Product::firstOrCreate([
                'name' => $lockedRequest->name,
                'category' => $lockedRequest->category,
                'price' => $lockedRequest->reference_price,
                'umkm_id' => $lockedOffer->umkm_id,
            ], [
                'partner_profit' => $lockedRequest->partner_profit,
                'hotel_price' => (float) $lockedRequest->reference_price + (float) $lockedRequest->partner_profit,
                'quantity' => $lockedOffer->quantity_offered ?: $lockedRequest->quantity,
                'status' => 'available',
            ]);
            $lockedRequest->update([
                'status' => 'fulfilled',
                'taken_by_umkm_id' => $lockedOffer->umkm_id,
                'price_offered' => $lockedRequest->reference_price,
            ]);
        });

        return response()->json(['request' => $productRequest->fresh()->load(['takenByUmkm', 'offers.umkm'])]);
    }

    public function rejectOffer(ProductRequest $productRequest, ProductRequestOffer $offer)
    {
        if (Auth::user()?->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($offer->product_request_id !== $productRequest->id || !in_array($productRequest->status, ['open', 'pending_approval'], true) || $offer->status !== 'pending') {
            return response()->json(['message' => 'Peserta tester tidak dapat diproses'], 422);
        }

        $offer->update(['status' => 'rejected']);
        if (!$productRequest->offers()->whereIn('status', ['pending', 'approved'])->exists()) {
            $productRequest->update(['status' => 'unfulfilled']);
        }

        return response()->json(['request' => $productRequest->fresh()->load(['takenByUmkm', 'offers.umkm'])]);
    }

    private function expireUnclaimedRequests($requests): void
    {
        foreach ($requests as $requestItem) {
            if ($requestItem->status === 'open' && $requestItem->participation_deadline && now()->greaterThan($requestItem->participation_deadline)) {
                if (!$requestItem->offers()->exists()) {
                    $requestItem->update(['status' => 'expired']);
                } else {
                    $requestItem->update(['status' => 'pending_approval']);
                }
            }
        }
    }

    public function approve(ProductRequest $productRequest)
    {
        if (Auth::user()?->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($productRequest->status !== 'pending_approval' || !$productRequest->taken_by_umkm_id) {
            return response()->json(['message' => 'Request tidak sedang menunggu persetujuan'], 422);
        }

        $umkmId = $productRequest->taken_by_umkm_id;
        DB::transaction(function () use ($productRequest) {
            $productRequest->offers()->where('status', 'pending')->update(['status' => 'approved']);
            $productRequest->update([
                'status' => 'taken',
                'delivered_to_partner_at' => null,
            ]);
        });

        $umkmUserId = \App\Models\Umkm::whereKey($umkmId)->value('user_id');
        if ($umkmUserId) {
            AppNotificationService::notifyUser(
                $umkmUserId,
                'Pengajuan disetujui',
                "Tester {$productRequest->name} disetujui dan produk sudah masuk ke Mitra.",
                "/umkm/request-produk?id={$productRequest->id}"
            );
        }

        return response()->json(['request' => $productRequest->fresh()->load(['takenByUmkm', 'offers.umkm'])]);
    }

    public function reject(Request $request, ProductRequest $productRequest)
    {
        if (Auth::user()?->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($productRequest->status !== 'pending_approval') {
            return response()->json(['message' => 'Request tidak sedang menunggu persetujuan'], 422);
        }

        $validated = $request->validate([
            'rejection_reason' => 'required|string|min:5|max:1000',
        ]);

        $umkmId = $productRequest->taken_by_umkm_id;
        $productRequest->offers()->where('status', 'pending')->update(['status' => 'rejected']);
        $productRequest->update([
            'status' => 'open',
            'taken_by_umkm_id' => null,
            'price_offered' => null,
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        $umkmUserId = \App\Models\Umkm::whereKey($umkmId)->value('user_id');
        if ($umkmUserId) {
            AppNotificationService::notifyUser(
                $umkmUserId,
                'Pengajuan ditolak',
                "Pengajuan {$productRequest->name} ditolak. Alasan: {$validated['rejection_reason']}",
                "/umkm/request-produk?id={$productRequest->id}"
            );
        }

        return response()->json(['request' => $productRequest->fresh()->load(['takenByUmkm', 'offers.umkm'])]);
    }

    public function confirmDelivery(ProductRequest $productRequest)
    {
        if (Auth::user()?->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($productRequest->status !== 'taken') {
            return response()->json(['message' => 'Request belum disetujui'], 422);
        }

        if ($productRequest->delivered_to_partner_at) {
            return response()->json(['message' => 'Pengantaran produk sudah dikonfirmasi'], 422);
        }

        DB::transaction(function () use ($productRequest) {
            Product::firstOrCreate([
                'name' => $productRequest->name,
                'category' => $productRequest->category,
                'price' => $productRequest->price_offered,
                'partner_profit' => $productRequest->partner_profit,
                'hotel_price' => (float) $productRequest->price_offered + (float) $productRequest->partner_profit,
                'quantity' => $productRequest->quantity,
                'umkm_id' => $productRequest->taken_by_umkm_id,
            ], [
                'status' => 'available',
            ]);

            $productRequest->update(['delivered_to_partner_at' => now()]);
        });

        $umkmUserId = $productRequest->takenByUmkm?->user_id;
        if ($umkmUserId) {
            AppNotificationService::notifyUser(
                $umkmUserId,
                'Produk masuk katalog',
                "Produk {$productRequest->name} sudah dikonfirmasi diantar dan masuk katalog.",
                '/umkm/produk'
            );
        }

        return response()->json([
            'request' => $productRequest->fresh()->load(['takenByUmkm', 'offers.umkm']),
        ]);
    }
}
