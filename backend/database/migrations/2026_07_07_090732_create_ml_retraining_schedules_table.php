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
        Schema::create('ml_retraining_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId("created_by")->constrained("users")->onDelete("set null");
            $table->foreignId("current_model_id")->constrained("ml_models")->onDelete("set null");
            $table->enum("schedule_type",['ANNUAL','DATA_THRESHOLD','MANUAL']);
            $table->decimal("data_threshold_percent",5,2)->default(20);
            $table->timestamp("next_scheduled_at")->nullable();
            $table->timestamp("last_retrained_at")->nullable();
            $table->integer("records_at_last_train")->nullable();
            $table->integer("current_record_count")->nullable();
            $table->boolean("is_active")->default(true);
            $table->text("notes")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ml_retraining_schedules');
    }
};
