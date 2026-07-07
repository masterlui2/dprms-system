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
        Schema::create('ml_feature_importances', function (Blueprint $table) {
            $table->id();
            $table->foreignId("prediction_run_id")->constrained("ml_prediction_runs")->onDelete("set null");
            $table->foreignId("model_id")->constrained("ml_models")->onDelete("set null");
            $table->enum("output_type",['ENTERPRISE_GROWTH','SUSTAINABILITY_STATUS','RENEWAL_RECOMMENDATION']);
            $table->string("feature_name",255);
            $table->decimal("importance_score",10,8);
            $table->integer("importance_rank");
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ml_feature_importances');
    }
};
