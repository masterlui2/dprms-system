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
        Schema::create('interventions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quarter_id')->constrained('quarterly_metrics')->restrictOnDelete();
            $table->string('name');
            $table->enum('type',['CONSULTANCY','TRAINING','TECHNOLOGY','TESTING','OTHERS']);
            $table->enum('availed',[0,1]);
            $table->string('intervention');
            $table->date('date');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('interventions');
    }
};
