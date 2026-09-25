<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_requests', function (Blueprint $table) {
            $table->dropColumn('delivered_to_partner_at');
        });
    }

    public function down(): void
    {
        Schema::table('product_requests', function (Blueprint $table) {
            $table->timestamp('delivered_to_partner_at')->nullable()->after('price_offered');
        });
    }
};