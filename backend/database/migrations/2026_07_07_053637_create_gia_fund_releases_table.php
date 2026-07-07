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
        Schema::create('gia_fund_releases', function (Blueprint $table) {
            $table->id();
            $table->foreignId("project_budget_id")->constrained("project_budgets")->onDelete("set null");
            $table->foreignId("released_by")->constrained("users")->onDelete("set null");
            $table->integer("tranche_number");
            $table->string("tranche_description",255)->nullable();
            $table->decimal("amount_released",15,2);
            $table->date("release_date");
            $table->string("milestone_reference",255)->nullable();
            $table->string("disbursement_voucher",255)->nullable();
            $table->decimal("cumulative_released",15,2);
            $table->decimal("remaining_balance",15,2);
            $table->string("supporting_doc_path",500)->nullable();
            $table->foreignId("verified_by")->nullable()->constrained("users")->onDelete("set null");
            $table->timestamp("verified_at")->useCurrent()->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gia_fund_releases');
    }
};
