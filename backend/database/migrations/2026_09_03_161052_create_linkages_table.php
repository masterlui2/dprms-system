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
        Schema::create('linkages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quarter_id')->constrained('quarterly_metrics')->restrictOnDelete();
            $table->string('name');
            $table->enum('type',['foward','backward']);
            $table->unsignedInteger('male_quantity');
            $table->unsignedInteger('female_quantity');
            $table->unsignedInteger('total')->storedAs('male_quantity + female_quantity');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('linkages');
    }
};
