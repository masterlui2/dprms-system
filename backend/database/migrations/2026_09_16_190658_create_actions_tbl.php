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
        Schema::create('actions_tbl', function (Blueprint $table) {
            $table->id();
            $table->foreignId('executive_summary_id')->constrained('executive_summary_tbl')->cascadeOnDelete();
            $table->string('cooperating_agency');
            $table->text('plan');
            $table->text('solutions');
            $table->text('concern');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('actions_tbl');
    }
};
