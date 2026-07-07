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
        Schema::create('gia_proposals', function (Blueprint $table) {
            $table->id();
            $table->foreignId("proposal_id")->unique()->constrained("proposals")->onDelete("set null");
            $table->string("research_title",500);
            $table->enum("research_type",["Basic Research","Applied Research", "Development","Demonstration"]);
            $table->string("sectoral_council",255);
            $table->string("call_for_proposals_ref",255)->nullable();
            $table->integer("research_duration_months");
            $table->decimal("total_budget_requested",15,2)->nullable();
            $table->string("implementing_agency",255);
            $table->text("project_site")->nullable();
            $table->text("abstract")->nullable();
            $table->decimal("gad_score",5,2)->nullable();
            $table->string("gad_scoresheet_path",500)->nullable();
            $table->string("capsule_proposal_path",500)->nullable();
            $table->string("full_proposal_path",500)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gia_proposals');
    }
};
