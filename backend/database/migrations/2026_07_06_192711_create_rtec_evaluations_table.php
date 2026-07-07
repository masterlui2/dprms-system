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
        Schema::create('rtec_evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId("proposal_id")->constrained("proposals")->onDelete("set null");
            $table->date("evaluation_date")->nullable();
            $table->enum("status",['PENDING','IN_PROGRESS','COMPLETED','SIGNED_OFF']);
            $table->decimal("aggregate_score",5,2)->nullable();
            $table->decimal("passing_threshold",5,2)->default(75);
            $table->enum("overall_recommendations",['APPROVE','REVISE','DISAPPROVE'])->nullable();
            $table->foreignId("signed_off_by")->constrained("users")->onDelete("set null");
            $table->timestamp("signed_off_at")->useCurrent()->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rtec_evaluations');
    }
};
