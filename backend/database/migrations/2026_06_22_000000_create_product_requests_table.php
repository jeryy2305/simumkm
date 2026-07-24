<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('product_requests', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category');
            $table->unsignedInteger('quantity');
            $table->decimal('reference_price', 10, 2)->nullable();
            $table->text('description')->nullable();
            $table->enum('status', ['open', 'taken', 'completed', 'cancelled'])->default('open');
            $table->foreignId('taken_by_umkm_id')->nullable()->constrained('umkms')->nullOnDelete();
            $table->decimal('price_offered', 10, 2)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_requests');
    }
};
