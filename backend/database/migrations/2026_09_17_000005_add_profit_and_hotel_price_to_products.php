<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('partner_profit', 10, 2)->default(0)->after('price');
            $table->decimal('hotel_price', 10, 2)->default(0)->after('partner_profit');
        });

        DB::table('products')->where('hotel_price', 0)->update(['hotel_price' => DB::raw('price')]);
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['partner_profit', 'hotel_price']);
        });
    }
};
