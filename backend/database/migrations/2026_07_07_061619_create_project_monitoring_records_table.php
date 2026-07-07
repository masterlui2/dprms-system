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
        Schema::create('project_monitoring_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId("proposal_id")->constrained("proposals")->onDelete("set null");
            $table->foreignId("assigned_monitor")->nullable()->constrained("users")->onDelete("set null");
            $table->enum("program_type",['SETUP','GIA']);
            $table->enum("implementation_status",['NOT_STARTED','IN_PROGRESS','COMPLETED','SUSPENDED','TERMINATED']);
            $table->date("start_date")->nullable();
            $table->date("expected_end_date")->nullable();
            $table->date("actual_end_date")->nullable();
            $table->decimal("overall_compliance",5,2)->default(0);
            $table->timestamp("last_monitored_at")->nullable();
            $table->text("monitoring_notes")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_monitoring_records');
    }
};
