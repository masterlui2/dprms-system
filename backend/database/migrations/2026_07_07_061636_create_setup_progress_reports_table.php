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
        Schema::create('setup_progress_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId("monitoring_record_id")->constrained("project_monitoring_records")->onDelete("set null");
            $table->foreignId("submitted_by")->constrained("users")->onDelete("set null");
            $table->enum("report_type",['QUARTERLY','SEMESTRAL','ANNUAL','SPECIAL']);
            $table->string("reporting_period",100);
            $table->integer("reporting_quarter")->nullable();
            $table->integer("reporting_year");
            $table->decimal("income_generated",15,2)->nullable();
            $table->integer("employment_generated")->nullable();
            $table->text("production_output")->nullable();
            $table->text("market_expansion")->nullable();
            $table->text("challenges_encountered")->nullable();
            $table->text("actions_taken")->nullable();
            $table->enum("status",['DRAFT','SUBMITTED','UNDER_REVIEW','ACCEPTED','RETURNED']);
            $table->timestamp("submitted_at")->nullable();
            $table->date("due_date");
            $table->boolean("is_late")->default(false);
            $table->integer("days_late")->default(0);
            $table->foreignId("reviewed_by")->nullable()->constrained("users")->onDelete("set null");
            $table->timestamp("reviewed_at")->nullable();
            $table->text("review_remarks")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('setup_progress_reports');
    }
};
