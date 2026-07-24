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
        Schema::create('ai_predictions', function (Blueprint $table) {
            $table->id();
            $table->foreignId("projects_id")->constrained("projects")->restrictOnDelete();
            $table->foreignId("triggered_by")->constrained("users")->nullOnDelete();
            $table->jsonb("input_features");
            $table->enum("enterprise_growth",['expanding','stable','declining']);
            $table->enum("sustainability_status",['sustainable','moderately_sustainable','unsustainable']);
            $table->enum("renewal_recommendation",['renewal_recommended','needs_intervention','at_risk']);
            $table->boolean("risk_flag")->default(false);
            $table->text("risk_reason")->nullable();
            $table->text("shap_explanation")->nullable();
            $table->boolean("is_reviewed")->default(false);
            $table->foreignId("reviewed_by")->constrained("users")->nullOnDelete();
            $table->timestamp("reviewed_at")->nullable();
            $table->timestamp("predicted_at")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_predictions');
    }
};
