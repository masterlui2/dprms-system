<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gia_progress_reports', function (Blueprint $table) {
            $table->json('form_data')->nullable()->after('review_remarks');
        });
    }

    public function down(): void
    {
        Schema::table('gia_progress_reports', function (Blueprint $table) {
            $table->dropColumn('form_data');
        });
    }
};
