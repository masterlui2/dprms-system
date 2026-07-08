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
        Schema::table('gia_documents', function (Blueprint $table) {
            $table->dropColumn("verifiation_remarks");
        });

        Schema::table('gia_documents', function (Blueprint $table) {
            $table->text("verification_remarks")->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('gia_documents', function (Blueprint $table) {
            $table->dropColumn("verification_remarks");
        });

        Schema::table('gia_documents', function (Blueprint $table) {
            $table->text("verifiation_remarks")->nullable();
        });
    }
};
