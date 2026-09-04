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
        Schema::create('production_materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quarter_id')->constrained('quarterly_metrics')->restrictOnDelete();
            $table->string('materials');
            $table->string('unit');
            $table->unsignedInteger('quantity');
            $table->unsignedInteger('cost');
            $table->unsignedInteger('total')->storedAs('quantity * cost');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_materials');
    }
};
