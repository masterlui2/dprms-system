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
        Schema::create('compliance_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId("monitoring_record_id")->constrained("project_monitoring_records")->onDelete("set null");
            $table->enum("compliance_type",['REPORT_SUBMISSION','REPAYMENT_SCHEDULE','SITE_VISIT','EQUIPMENT_UTILIZATION','DELIVERABLE_COMPLETION','DOCUMENTARY_REQUIREMENT']);
            $table->string("requirement_description",255);
            $table->date("due_date")->nullable();
            $table->date("completed_date")->nullable();
            $table->enum("status",['PENDING','COMPLIANT','NON_COMPLIANT','OVERDUE','WAIVED']);
            $table->integer("days_overdue")->default(0);
            $table->foreignId("verified_by")->constrained("users")->onDelete("set null");
            $table->timestamp("verified_at")->nullable();
            $table->text("remarks");
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('compliance_records');
    }
};
