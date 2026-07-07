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
        Schema::create('technical_panel_evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId("assignment_id")->constrained("technical_panel_assignments")->onDelete("set null");
            $table->foreignId("proposal_id")->constrained("proposals")->onDelete("set null");
            $table->foreignId("reviewed_by")->constrained("users")->onDelete("set null");
            $table->decimal("scientific_validity",5,2)->nullable();
            $table->decimal("methodology_score",5,2)->nullable();
            $table->decimal("feasibility_score",5,2)->nullable();
            $table->decimal("impact_score",5,2)->nullable();
            $table->decimal("overall_score",5,2)->nullable();
            $table->text("strengths")->nullable();
            $table->text("weaknesses")->nullable();
            $table->text("recommendations")->nullable();
            $table->enum("recommendation",['APPROVE','REVISE','DISAPPROVE'])->nullable();
            $table->timestamp("submitted_at")->useCurrent()->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('technical_panel_evaluations');
    }
};
