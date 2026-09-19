<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->string('employment_type', 16)->default('DIRECT');
            $table->string('sectoral_classification', 16)->nullable();
        });

        Schema::table('markets', function (Blueprint $table) {
            $table->string('market_type', 16)->default('LOCAL');
        });

        DB::table('employees')->update([
            'sectoral_classification' => DB::raw('sectoral_group'),
        ]);
    }

    public function down(): void
    {
        Schema::table('markets', function (Blueprint $table) {
            $table->dropColumn('market_type');
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['employment_type', 'sectoral_classification']);
        });
    }
};
