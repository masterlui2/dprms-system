<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('repayment_transactions', function (Blueprint $table) {
            $table->foreignId('verified_by')->nullable()->change();
            $table->date('payment_date')->nullable()->after('check_date');
        });

        DB::table('repayment_transactions')
            ->whereNull('payment_date')
            ->update(['payment_date' => DB::raw('check_date')]);
    }

    public function down(): void
    {
        DB::table('repayment_transactions')
            ->whereNull('verified_by')
            ->update(['verified_by' => DB::raw('uploaded_by')]);

        Schema::table('repayment_transactions', function (Blueprint $table) {
            $table->dropColumn('payment_date');
            $table->foreignId('verified_by')->nullable(false)->change();
        });
    }
};
