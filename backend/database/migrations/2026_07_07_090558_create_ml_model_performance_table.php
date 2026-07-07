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
        Schema::create('ml_model_performance', function (Blueprint $table) {
            $table->id();
            $table->foreignId("model_id")->unique()->constrained("ml_models")->onDelete("set null");
            $table->decimal("overall_accuracy",5,4);
            $table->boolean("meets_threshold")->default(false);
            $table->decimal("passing_threshold",5,4)->default(0.8);
            $table->decimal("growth_precision",5,4)->nullable();
            $table->decimal("growth_recall",5,4)->nullable();
            $table->decimal("growth_f1_score",5,4)->nullable();
            $table->decimal("growth_accuracy",5,4)->nullable();
            $table->decimal("sustainability_precision",5,4)->nullable();
            $table->decimal("sustainability_recall",5,4)->nullable();
            $table->decimal("sustainability_f1_score",5,4)->nullable();
            $table->decimal("sustainability_accuracy",5,4)->nullable();
            $table->decimal("renewal_precision",5,4)->nullable();
            $table->decimal("renewal_recall",5,4)->nullable();
            $table->decimal("renewal_f1_score",5,4)->nullable();
            $table->decimal("renewal_accuracy",5,4)->nullable();
            $table->jsonb("confusion_matrix")->nullable();
            $table->timestamp("evaluated_at")->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ml_model_performance');
    }
};
