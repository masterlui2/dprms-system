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
        Schema::create('outputs_tbl', function (Blueprint $table) {
            $table->id();
            $table->foreignId('executive_summary_id')->constrained('executive_summary_tbl')->cascadeOnDelete();
            $table->string('expected_output');
            $table->integer('target')->default(0);
            $table->integer('actual')->default(0);
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('outputs_tbl');
    }
};
