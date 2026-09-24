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
            $table->string('distribution_status_new')->default('waiting')->after('distribution_status');
        });

        DB::statement("UPDATE consignments SET distribution_status_new = CASE WHEN distribution_status = 'completed' THEN 'received' ELSE 'waiting' END");

        Schema::table('consignments', function (Blueprint $table) {
            $table->dropColumn('distribution_status');
        });

        Schema::table('consignments', function (Blueprint $table) {
            $table->renameColumn('distribution_status_new', 'distribution_status');
        });
    }

    public function down(): void
    {
        Schema::table('consignments', function (Blueprint $table) {
            $table->string('distribution_status_old')->default('pending')->after('distribution_status');
        });

        DB::statement("UPDATE consignments SET distribution_status_old = CASE WHEN distribution_status = 'received' THEN 'completed' ELSE 'pending' END");

        Schema::table('consignments', function (Blueprint $table) {
            $table->dropColumn('distribution_status');
        });

        Schema::table('consignments', function (Blueprint $table) {
            $table->renameColumn('distribution_status_old', 'distribution_status');
        });
    }
};