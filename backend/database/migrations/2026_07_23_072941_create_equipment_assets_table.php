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
        Schema::create('equipment_assets', function (Blueprint $table) {
            $table->id();
            $table->foreignId("project_id")->constrained("projects")->restrictOnDelete();
            $table->foreignId("logged_by")->constrained("users")->nullOnDelete();
            $table->string("equipment_name",255);
            $table->string("serial_number",255)->nullable()->unique();
            $table->decimal("acquisition_cost",15,2)->nullable();
            $table->date("acquisition_date")->nullable();
            $table->enum("condition",['good','fair','poor','non_functional'])->default('good');
            $table->timestamp("last_checked_at")->nullable();
            $table->text("notes")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('equipment_assets');
    }
};
