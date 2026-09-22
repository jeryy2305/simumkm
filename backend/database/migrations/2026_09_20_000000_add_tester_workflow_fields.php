<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_requests', function (Blueprint $table) {
            $table->timestamp('participation_deadline')->nullable()->after('status');
        });

        Schema::table('product_request_offers', function (Blueprint $table) {
            $table->unsignedInteger('quantity_offered')->nullable()->after('price_offered');
        });

        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE product_requests DROP CONSTRAINT IF EXISTS product_requests_status_check');
            DB::statement("ALTER TABLE product_requests ADD CONSTRAINT product_requests_status_check CHECK (status IN ('open', 'pending_approval', 'taken', 'completed', 'cancelled', 'expired', 'fulfilled', 'unfulfilled'))");
        }
    }

    public function down(): void
    {
        Schema::table('product_request_offers', function (Blueprint $table) {
            $table->dropColumn('quantity_offered');
        });

        Schema::table('product_requests', function (Blueprint $table) {
            $table->dropColumn('participation_deadline');
        });

        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE product_requests DROP CONSTRAINT IF EXISTS product_requests_status_check');
            DB::statement("ALTER TABLE product_requests ADD CONSTRAINT product_requests_status_check CHECK (status IN ('open', 'pending_approval', 'taken', 'completed', 'cancelled'))");
        }
    }
};