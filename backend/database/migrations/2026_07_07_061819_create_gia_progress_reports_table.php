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
        Schema::create('gia_progress_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId("monitoring_record_id")->constrained("project_monitoring_records")->onDelete("set null");
            $table->foreignId("submitted_by")->constrained("users")->onDelete("set null");
            $table->enum("report_type",['PROGRESS','TECHNICAL','FINANCIAL','TERMINAL']);
            $table->string("reporting_period",100);
            $table->integer("reporting_year");
            $table->string("milestone_reference",255)->nullable();
            $table->text("research_progress")->nullable();
            $table->text("objectivves_achieved")->nullable();
            $table->text("challenges_encountered")->nullable();
            $table->text("next_period_plans")->nullable();
            $table->decimal("budget_utilization",15,2)->nullable();
            $table->enum("status",['DRAFT','SUBMITTED','UNDER_REVIEW','ACCEPTED','RETURNED']);
            $table->timestamp("submitted_at")->useCurrent()->nullable();
            $table->date("due_date");
            $table->boolean("is_late")->default(false);
            $table->integer("days_late")->default(0);
            $table->foreignId("reviewed_by")->nullable()->constrained("users")->onDelete("set null");
            $table->timestamp("reviewed_at")->useCurrent()->nullable();
            $table->text("review_remarks")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gia_progress_reports');
    }
};
