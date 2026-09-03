<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('equipment_registries', function (Blueprint $table) {
            $table->string('property_number', 100)->nullable()->unique()->after('serial_number');
            $table->string('unit', 50)->default('unit')->after('property_number');
            $table->string('location', 500)->nullable()->after('supplier_name');
            $table->date('installed_at')->nullable()->after('acquisition_date');
        });
    }

    public function down(): void
    {
        Schema::table('equipment_registries', function (Blueprint $table) {
            $table->dropUnique(['property_number']);
            $table->dropColumn(['property_number', 'unit', 'location', 'installed_at']);
        });
    }
};
