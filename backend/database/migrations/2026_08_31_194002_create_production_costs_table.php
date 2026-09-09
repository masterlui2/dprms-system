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
        Schema::create('production_costs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quarter_id')->constrained('quarterly_metrics')->restrictOnDelete();
            $table->string('particulars', 255);
            $table->enum('type',['OPERATION','LABOR','MISCELLANEOUS']);
            $table->decimal('month_1', 15, 2)->default(0);
            $table->decimal('month_2', 15, 2)->default(0);
            $table->decimal('month_3', 15, 2)->default(0);
            $table->decimal('total', 15, 2)
                ->storedAs('month_1 + month_2 + month_3');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_costs');
    }
};
