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
        Schema::create('report_schedule_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId("scheduled_id")->constrained("report_schedules")->onDelete("set null");
            $table->foreignId("generated_report_id")->nullable()->constrained("generated_reports")->onDelete("set null");
            $table->enum("execution_status",['SUCCESS','FAILED','SKIPPED']);
            $table->timestamp("started_at")->useCurrent();
            $table->timestamp("completed_at")->useCurrent()->nullable();
            $table->text("error_message")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_schedule_logs');
    }
};
