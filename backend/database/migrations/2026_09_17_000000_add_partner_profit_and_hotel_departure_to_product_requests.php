<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_requests', function (Blueprint $table) {
            $table->decimal('partner_profit', 10, 2)->nullable()->after('reference_price');
            $table->date('hotel_departure_date')->nullable()->after('partner_profit');
            $table->time('hotel_departure_time')->nullable()->after('hotel_departure_date');
        });
    }

    public function down(): void
    {
        Schema::table('product_requests', function (Blueprint $table) {
            $table->dropColumn(['partner_profit', 'hotel_departure_date', 'hotel_departure_time']);
        });
    }
};
