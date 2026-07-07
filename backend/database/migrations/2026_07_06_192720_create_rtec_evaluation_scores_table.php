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
        Schema::create('rtec_evaluation_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId("rtec_evaluation_id")->constrained("rtec_evaluations")->onDelete("set null");
            $table->foreignId("evaluated_by")->constrained("users")->onDelete("set null");
            $table->enum("dimension",['TECHNICAL','MARKETING','MANAGEMENT','FINANCIAL','WASTE_DISPOSAL']);
            $table->decimal("score",5,2);
            $table->decimal("max_score",5,2);
            $table->text("notes")->nullable();
            $table->timestamp("submitted_at")->useCurrent()->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rtec_evaluation_scores');
    }
};
