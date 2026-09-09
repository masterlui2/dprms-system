<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_budgets', function (Blueprint $table) {
            $table->decimal('total_amount', 15, 2)->change();
            $table->decimal('budget_ceiling', 15, 2)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('project_budgets', function (Blueprint $table) {
            $table->decimal('total_amount', 5, 2)->change();
            $table->decimal('budget_ceiling', 5, 2)->nullable()->change();
        });
    }
};
