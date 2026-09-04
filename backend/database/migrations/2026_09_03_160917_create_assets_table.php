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
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quarter_id')->constrained('quarterly_metrics')->restrictOnDelete();
            $table->string('asset_name',255);
            $table->string('type',255);
            $table->unsignedInteger('lifespan');
            $table->unsignedInteger('year_acquired');
            $table->decimal('cost',15,2);
            $table->decimal('depreciation',15,2)->storedAs('cost / lifespan');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
