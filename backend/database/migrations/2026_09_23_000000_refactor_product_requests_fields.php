<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_requests', function (Blueprint $table) {
            $table->renameColumn('hotel_departure_date', 'tester_delivery_date');
            $table->dropColumn('description');
        });
    }

    public function down(): void
    {
        Schema::table('product_requests', function (Blueprint $table) {
            $table->renameColumn('tester_delivery_date', 'hotel_departure_date');
            $table->string('description')->nullable()->after('tester_delivery_date');
        });
    }
};
