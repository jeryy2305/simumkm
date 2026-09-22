<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('consignments')
            ->where('status', 'active')
            ->update(['status' => 'completed']);
    }

    public function down(): void
    {
        // Existing completed records cannot be safely distinguished from normalized active records.
    }
};
