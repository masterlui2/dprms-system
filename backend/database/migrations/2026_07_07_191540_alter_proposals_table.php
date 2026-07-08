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
        Schema::table('proposals', function (Blueprint $table) {
            $table->dropForeign(['submitted_by']);
        });

        Schema::table('proposals', function (Blueprint $table) {
            $table->foreign("submitted_by")->references("id")->on("users")->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('proposals', function (Blueprint $table) {
            $table->dropForeign(['submitted_by']);
        });

        Schema::table('proposals', function (Blueprint $table) {
            $table->foreign("submitted_by")->references("id")->on("users")->nullOnDelete();
        });
    }
};
