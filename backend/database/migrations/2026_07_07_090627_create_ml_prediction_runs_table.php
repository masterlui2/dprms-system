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
        Schema::create('ml_prediction_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId("model_id")->constrained("ml_models")->onDelete("set null");
            $table->foreignId("triggered_by")->constrained("users")->onDelete("set null");
            $table->enum("run_type",['SINGLE','BATCH']);
            $table->string("run_reference",100)->unique();
            $table->integer("total_beneficiaries")->default(1);
            $table->integer("successful_predictions")->default(0);
            $table->integer("failed_predictions")->default(0);
            $table->enum("status",['PENDING','PROCESSING','COMPLETED','FAILED']);
            $table->timestamp("started_at")->useCurrent()->nullable();
            $table->timestamp("completed_at")->useCurrent()->nullable();
            $table->integer("duration_seconds")->nullable();
            $table->text("error_message")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ml_prediction_runs');
    }
};
