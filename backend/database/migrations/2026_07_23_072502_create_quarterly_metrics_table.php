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
        Schema::create('quarterly_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId("project_id")->constrained("projects")->restrictOnDelete();
            $table->foreignId("submitted_by")->constrained("users")->restrictOnDelete();
            $table->integer("quarter");
            $table->integer("year");
            $table->decimal("gross_sales",15,2)->nullable();
            $table->integer("production_volume")->nullable();
            $table->integer("employee_count")->nullable();
            $table->decimal('total_cost',15,2)->nullable();
            $table->timestamp("submitted_at")->useCurrent();
            $table->unique(['project_id','quarter','year']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quarterly_metrics');
    }
};
