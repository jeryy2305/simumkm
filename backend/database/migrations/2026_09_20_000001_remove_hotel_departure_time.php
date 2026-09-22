<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('product_requests', 'hotel_departure_time')) {
            Schema::table('product_requests', function (Blueprint $table) {
                $table->dropColumn('hotel_departure_time');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasColumn('product_requests', 'hotel_departure_time')) {
            Schema::table('product_requests', function (Blueprint $table) {
                $table->time('hotel_departure_time')->nullable()->after('hotel_departure_date');
            });
        }
    }
};