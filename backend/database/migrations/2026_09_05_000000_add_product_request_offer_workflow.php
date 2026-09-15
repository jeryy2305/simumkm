<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_requests', function (Blueprint $table) {
            $table->string('status')->default('open')->change();
        });

        Schema::create('product_request_offers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_request_id')->constrained('product_requests')->cascadeOnDelete();
            $table->foreignId('umkm_id')->constrained('umkms')->cascadeOnDelete();
            $table->decimal('price_offered', 10, 2);
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_request_offers');

        Schema::table('product_requests', function (Blueprint $table) {
            $table->enum('status', ['open', 'taken', 'completed', 'cancelled'])->default('open')->change();
        });
    }
};