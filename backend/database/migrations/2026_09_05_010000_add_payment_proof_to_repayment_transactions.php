<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('repayment_transactions', function (Blueprint $table) {
            $table->string('proof_path', 500)->nullable()->after('payment_date');
            $table->string('proof_original_name')->nullable()->after('proof_path');
            $table->string('proof_mime_type', 100)->nullable()->after('proof_original_name');
        });
    }

    public function down(): void
    {
        Schema::table('repayment_transactions', function (Blueprint $table) {
            $table->dropColumn([
                'proof_path',
                'proof_original_name',
                'proof_mime_type',
            ]);
        });
    }
};
