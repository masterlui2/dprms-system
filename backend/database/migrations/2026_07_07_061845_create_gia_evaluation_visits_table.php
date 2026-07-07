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
        Schema::create('gia_evaluation_visits', function (Blueprint $table) {
            $table->id();
            $table->foreignId("monitoring_record_id")->constrained("project_monitoring_records")->onDelete("set null");
            $table->foreignId("scheduled_by")->constrained("users")->onDelete("set null");
            $table->foreignId("assigned_personnel")->constrained("users")->onDelete("set null");
            $table->string("visit_purpose",255);
            $table->date("scheduled_date");
            $table->date("actual_visit_date")->nullable();
            $table->enum("status",['SCHEDULED','COMPLETED','CANCELLED','RESCHEDULED']);
            $table->text("research_progress_notes")->nullable();
            $table->text("resource_utilization")->nullable();
            $table->text("deliverable_status")->nullable();
            $table->text("recommendations")->nullable();
            $table->string("report_path",100)->nullable();
            $table->foreignId("encoded_by")->nullable()->constrained("users")->onDelete("set null");
            $table->timestamp("encoded_at")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gia_evaluation_visits');
    }
};
