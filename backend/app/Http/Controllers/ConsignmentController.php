<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Consignment;
use App\Models\Product;
use App\Services\AppNotificationService;

class ConsignmentController extends Controller
{
    public function index()
    {
        return response()->json(Consignment::with('umkm', 'product')->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'company' => 'required',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'duration_days' => 'required|integer',
            'start_date' => 'required|date',
            'status' => 'required|in:active,completed,cancelled',
            'umkm_id' => 'required|exists:umkms,id',
        ]);

        $consignment = Consignment::create(array_merge($request->all(), ['status' => 'completed']));
        Product::whereKey($consignment->product_id)->update(['status' => 'available']);
        $userId = \App\Models\Umkm::whereKey($consignment->umkm_id)->value('user_id');
        if ($userId) {
            AppNotificationService::notifyUser((int) $userId, 'Produk selesai dititip', "Produk sudah dicatat dalam Data Penitipan di {$consignment->company}.", '/umkm/penitipan');
        }
        return response()->json($consignment, 201);
    }

    public function show(Consignment $consignment)
    {
        return response()->json($consignment->load('umkm', 'product'));
    }

    public function update(Request $request, Consignment $consignment)
    {
        $request->validate([
            'company' => 'required',
            'duration_days' => 'required|integer',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date',
            'status' => 'required|in:active,completed,cancelled',
        ]);

        $consignment->update($request->all());
        $userId = \App\Models\Umkm::whereKey($consignment->umkm_id)->value('user_id');
        if ($userId) {
            AppNotificationService::notifyUser((int) $userId, 'Data penitipan diperbarui', "Data penitipan di {$consignment->company} diperbarui oleh Admin.", '/umkm/penitipan');
        }
        return response()->json($consignment);
    }

    public function destroy(Consignment $consignment)
    {
        $umkmId = $consignment->umkm_id;
        $company = $consignment->company;
        // Capture product id before deleting consignment
        $productId = $consignment->product_id;

        // Delete the consignment
        $consignment->delete();

        // If there are no more consignments for this product, remove the product
        $hasOther = Consignment::where('product_id', $productId)->exists();
        if (! $hasOther) {
            try {
                // Use model to delete so events/cascades run
                $product = \App\Models\Product::find($productId);
                if ($product) {
                    $product->delete();
                }
            } catch (\Exception $e) {
                // Log but don't fail the request
                logger()->error('Failed to delete product after consignment removal: ' . $e->getMessage());
            }
        }

        $userId = \App\Models\Umkm::whereKey($umkmId)->value('user_id');
        if ($userId) {
            AppNotificationService::notifyUser((int) $userId, 'Data penitipan dihapus', "Data penitipan di {$company} dihapus oleh Admin.", '/umkm/penitipan');
        }

        return response()->json(['message' => 'Deleted']);
    }
}
