<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('equipment_registries', function (Blueprint $table) {
            $table->timestamp('last_checked_at')->nullable()->after('current_condition');
        });
    }

    public function down(): void
    {
        Schema::table('equipment_registries', function (Blueprint $table) {
            $table->dropColumn('last_checked_at');
        });
    }
};
