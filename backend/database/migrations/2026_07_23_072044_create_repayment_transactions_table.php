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
        Schema::create('repayment_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId("project_ledger_id")->constrained("project_ledgers")->restrictOnDelete();
            $table->foreignId("uploaded_by")->constrained("users")->restrictOnDelete();
            $table->foreignId("verified_by")->constrained("users")->restrictOnDelete();
            $table->decimal("amount_paid",15,2);
            $table->date("payment_due");
            $table->string("bank_branch");
            $table->string("check_number");
            $table->date("check_date");
            $table->string("or_number");
            $table->enum("status",['pending','verified','rejected'])->default('pending');
            $table->timestamp("verified_at")->nullable();
            $table->text("remarks")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('repayment_transactions');
    }
};
