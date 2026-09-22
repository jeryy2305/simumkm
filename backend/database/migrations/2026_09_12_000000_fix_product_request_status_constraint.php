<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement('ALTER TABLE product_requests DROP CONSTRAINT IF EXISTS product_requests_status_check');
        DB::statement("ALTER TABLE product_requests ADD CONSTRAINT product_requests_status_check CHECK (status IN ('open', 'pending_approval', 'taken', 'completed', 'cancelled'))");
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement('ALTER TABLE product_requests DROP CONSTRAINT IF EXISTS product_requests_status_check');
        DB::statement("ALTER TABLE product_requests ADD CONSTRAINT product_requests_status_check CHECK (status IN ('open', 'taken', 'completed', 'cancelled'))");
    }
};