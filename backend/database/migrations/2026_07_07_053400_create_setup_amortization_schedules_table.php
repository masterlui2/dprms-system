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
        Schema::create('setup_amortization_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId("project_budget_id")->unique()->constrained("project_budgets")->onDelete("set null");
            $table->foreignId("generated_by")->constrained("users")->onDelete("set null");
            $table->enum("repayment_period_years",['MONTHLY','QUARTERLY','SEMESTRAL','ANNUAL']);
            $table->integer("payment_interval");
            $table->decimal("total_installments",15,2);
            $table->decimal("installment_amount",15,2);
            $table->date("first_payment_due");
            $table->date("last_payment_due");
            $table->decimal("total_amount_due",15,2)->default(0);
            $table->decimal("total_amount_paid",15,2);
            $table->decimal("outstanding_balance",15,2);
            $table->enum("status",['CURRENT','OVERDUE','COMPLETED','SUSPENDED']);
            $table->timestamp("generated_at");
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('setup_amortization_schedules');
    }
};
