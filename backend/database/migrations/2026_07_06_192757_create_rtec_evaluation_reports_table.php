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
        Schema::create('rtec_evaluation_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId("rtec_evaluation_id")->constrained("rtec_evaluations")->onDelete("set null");
            $table->foreignId("generated_by")->constrained("users")->onDelete("set null");
            $table->string("report_reference",100)->unique();
            $table->jsonb("consolidated_scores");
            $table->text("summary_finding")->nullable();
            $table->enum("final_recommendation",['APPROVE','REVISE','DISAPPROVE']);
            $table->string("file_path",500)->nullable();
            $table->timestamp("generated_at");
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rtec_evaluation_reports');
    }
};
