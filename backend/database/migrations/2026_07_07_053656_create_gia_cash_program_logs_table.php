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
        Schema::create('gia_cash_program_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId("project_budget_id")->constrained("project_budgets")->onDelete("set null");
            $table->foreignId("submitted_by")->constrained("users")->onDelete("set null");
            $table->integer("reporting_month");
            $table->integer("reporting_year");
            $table->decimal("planned_expenditures",15,2);
            $table->decimal("actual_expenditures",15,2)->nullable();
            $table->decimal("variance",15,2)->nullable();
            $table->jsonb("expenditure_details")->nullable();
            $table->enum("status",['SUBMITTED','UNDER_REVIEW','VALIDATED','FLAGGED']);
            $table->foreignId("reviewed_by")->nullable()->constrained("users")->onDelete("set null");
            $table->timestamp("reviewed_at")->nullable();
            $table->text("review_remarks")->nullable();
            $table->string("supporting_doc_path",500)->nullable();
            $table->timestamp("submitted_at");
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gia_cash_program_logs');
    }
};
