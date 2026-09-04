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
        Schema::create('markets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quarter_id')->constrained('quarterly_metrics')->restrictOnDelete();
            $table->string('market_name',255);
            $table->string('address',255);
            $table->enum('condition',['old','new']);
            $table->date('effective_date');
            $table->string('contact_person',255);
            $table->string('service',255);
            $table->string('volume',255);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('markets');
    }
};
