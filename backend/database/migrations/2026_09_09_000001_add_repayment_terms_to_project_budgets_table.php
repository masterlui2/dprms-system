<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_budgets', function (Blueprint $table) {
            $table->date('full_release_date')->nullable()->after('fiscal_year');
            $table->date('amortization_start_date')->nullable()->after('full_release_date');
            $table->unsignedSmallInteger('repayment_term_months')->nullable()->after('amortization_start_date');
        });
    }

    public function down(): void
    {
        Schema::table('project_budgets', function (Blueprint $table) {
            $table->dropColumn([
                'full_release_date',
                'amortization_start_date',
                'repayment_term_months',
            ]);
        });
    }
};
