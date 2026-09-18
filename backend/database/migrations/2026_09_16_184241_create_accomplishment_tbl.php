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
        Schema::create('accomplishment_tbl', function (Blueprint $table) {
            $table->id();
            $table->foreignId('executive_summary_id')->constrained('executive_summary_tbl')->cascadeOnDelete();
            $table->text('objectives');
            $table->text('activities');
            $table->text('target_milestones');
            $table->decimal('weight', 5, 2)->default(0);
            $table->text('actual_accomplishment')->nullable();
            $table->decimal('actual', 5, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accomplishment_tbl');
    }
};
