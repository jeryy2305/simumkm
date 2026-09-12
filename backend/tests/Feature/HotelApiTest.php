<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class HotelApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_hotels(): void
    {
        $user = User::factory()->create([
            'role' => 'admin',
        ]);

        Sanctum::actingAs($user, ['*']);

        $this->getJson('/api/hotels')
            ->assertOk()
            ->assertJsonStructure([
                '*' => [
                    'id',
                    'name',
                    'city',
                    'address',
                    'phone',
                    'email',
                    'category',
                    'verified',
                    'created_at',
                    'updated_at',
                ],
            ]);
    }

    public function test_admin_can_create_hotel(): void
    {
        $user = User::factory()->create([
            'role' => 'admin',
        ]);

        Sanctum::actingAs($user, ['*']);

        $payload = [
            'name' => 'Hotel Test Batam',
            'city' => 'Batam',
            'address' => 'Jl. Raya Batam No. 1',
            'phone' => '08123456789',
            'email' => 'hotel@test.com',
            'category' => '3 Bintang',
            'verified' => true,
        ];

        $this->postJson('/api/hotels', $payload)
            ->assertStatus(201)
            ->assertJsonFragment([
                'name' => 'Hotel Test Batam',
                'city' => 'Batam',
                'verified' => true,
            ]);
    }
}
