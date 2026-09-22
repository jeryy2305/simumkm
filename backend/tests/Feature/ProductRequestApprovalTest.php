<?php

namespace Tests\Feature;

use App\Models\ProductRequest;
use App\Models\ProductRequestOffer;
use App\Models\Umkm;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProductRequestApprovalTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_approve_pending_offer_when_request_is_in_consistent_fulfilled_state(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $umkmUser = User::factory()->create([
            'role' => 'umkm',
        ]);

        $umkm = Umkm::create([
            'name' => 'UMKM Test',
            'owner' => 'Owner',
            'phone' => '08123456789',
            'address' => 'Jl. Test',
            'join_date' => now()->toDateString(),
            'status' => 'active',
            'user_id' => $umkmUser->id,
        ]);

        $request = ProductRequest::create([
            'name' => 'Ayam',
            'category' => 'Makanan',
            'quantity' => 15,
            'reference_price' => 6000,
            'partner_profit' => 500,
            'hotel_departure_date' => now()->addDay()->toDateString(),
            'status' => 'fulfilled',
            'participation_deadline' => now()->addDay(),
            'taken_by_umkm_id' => $umkm->id,
            'price_offered' => 6000,
        ]);

        $offer = ProductRequestOffer::create([
            'product_request_id' => $request->id,
            'umkm_id' => $umkm->id,
            'price_offered' => 6000,
            'quantity_offered' => 15,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($admin, ['*']);

        $response = $this->postJson("/api/product-requests/{$request->id}/offers/{$offer->id}/approve");

        $response->assertOk();
        $response->assertJsonPath('request.offers.0.status', 'approved');
    }
}
