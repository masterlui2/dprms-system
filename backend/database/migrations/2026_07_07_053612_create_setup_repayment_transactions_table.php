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
        Schema::create('setup_repayment_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId("amortization_id")->constrained("setup_amortization_schedules")->onDelete("set null");
            $table->foreignId("recorded_by")->constrained("users")->onDelete("set null");
            $table->integer("installment_number");
            $table->decimal("amount_due",15,2);
            $table->decimal("amount_paid",15,2);
            $table->date("payment_date");
            $table->date("due_date");
            $table->enum("payment_method",['CASH','CHECK','BANK_TRANSFER','OTHER']);
            $table->string("reference_number",100)->nullable();
            $table->boolean("is_late")->default(false);
            $table->integer("days_late")->default(0);
            $table->decimal("remaining_balance",15,2);
            $table->string("receipt_path",500)->nullable();
            $table->foreignId("verified_by")->nullable()->constrained("users")->onDelete("set null");
            $table->timestamp("verified_at")->useCurrent()->nullable();
            $table->text("notes")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('setup_repayment_transactions');
    }
};
