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
        Schema::create('ml_predictions', function (Blueprint $table) {
            $table->id();
            $table->foreignId("prediction_run_id")->constrained("ml_prediction_runs")->onDelete("set null");
            $table->foreignId("proposal_id")->constrained("proposals")->onDelete("set null");
            $table->foreignId("model_id")->constrained("ml_models")->onDelete("set null");
            $table->jsonb("input_features");
            $table->enum("enterprise_growth",['EXPANDING','STABLE','DECLINING']);
            $table->decimal("growth_confidence",5,4);
            $table->enum("sustainability_status",['SUSTAINABLE','MODERATELY_SUSTAINABLE','UNSUSTAINABLE']);
            $table->decimal("sustainability_confidence",5,4);
            $table->enum("renewal_recommendation",['RENEWAL_RECOMMENDED','NEEDS_INTERVENTION','AT_RISK']);
            $table->decimal("renewal_confidence",5,4);
            $table->jsonb("tree_votes_growth")->nullable();
            $table->jsonb("tree_votes_sustainability")->nullable();
            $table->jsonb("tree_votes_renewal")->nullable();
            $table->boolean("is_reviewed")->default(false);
            $table->foreignId("reviewed_by")->nullable()->constrained("users")->onDelete("set null");
            $table->timestamp("reviewed_at")->useCurrent()->nullable();
            $table->text("review_notes")->nullable();
            $table->timestamp("predicted_at")->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ml_predictions');
    }
};
