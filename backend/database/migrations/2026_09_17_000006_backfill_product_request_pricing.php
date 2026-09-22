<?php

use App\Models\Product;
use App\Models\ProductRequest;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Product::query()->each(function (Product $product): void {
            $request = ProductRequest::where('name', $product->name)
                ->where('category', $product->category)
                ->where('quantity', $product->quantity)
                ->where('price_offered', $product->price)
                ->where('taken_by_umkm_id', $product->umkm_id)
                ->whereNotNull('partner_profit')
                ->latest('id')
                ->first();

            if ($request) {
                $product->update([
                    'partner_profit' => $request->partner_profit,
                    'hotel_price' => (float) $product->price + (float) $request->partner_profit,
                ]);
            }
        });
    }

    public function down(): void
    {
        // Pricing backfills are intentionally retained when rolling back schema changes.
    }
};
