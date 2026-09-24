<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consignments', function (Blueprint $table) {
            $table->date('distribution_date')->nullable()->after('start_date');
            $table->enum('distribution_status', ['pending', 'completed'])
                ->default('pending')
                ->after('status');
        });

        DB::table('consignments')
            ->where('status', 'completed')
            ->update(['distribution_status' => 'completed']);

        DB::table('consignments')
            ->whereNull('distribution_date')
            ->update(['distribution_date' => DB::raw('start_date')]);
    }

    public function down(): void
    {
        Schema::table('consignments', function (Blueprint $table) {
            $table->dropColumn(['distribution_date', 'distribution_status']);
        });
    }
};