<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('setup_proposals', function (Blueprint $table) {
            $table->json('form_snapshot')->nullable()->after('business_address');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('setup_proposals', function (Blueprint $table) {
            $table->dropColumn('form_snapshot');
        });
    }
};
