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
        Schema::create('site_visits', function (Blueprint $table) {
            $table->id();
            $table->foreignId("monitoring_record_id")->constrained("project_monitoring_records")->onDelete("set null");
            $table->foreignId("scheduled_by")->constrained("users")->onDelete("set null");
            $table->foreignId("assigned_personnel")->constrained("users")->onDelete("set null");
            $table->enum("visit_type",['ROUTINE','COMPLIANCE','SPECIAL','FOLLOWUP']);
            $table->date("scheduled_date");
            $table->date("actual_visit_date")->nullable();
            $table->enum("status",['SCHEDULED','COMPLETED','CANCELLED','RESCHEDULED']);
            $table->boolean("notification_sent")->default(false);
            $table->timestamp("notification_sent_at")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('site_visits');
    }
};
