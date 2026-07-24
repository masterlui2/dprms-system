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
            $table->foreignId("submiited_by")->constrained("users")->restrictOnDelete();
            $table->integer("quarter");
            $table->integer("year");
            $table->decimal("gross_sales",15,2);
            $table->decimal("production_volume",15,2);
            $table->integer("employee_count");
            $table->timestamp("submitted_at")->useCurrent();
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
