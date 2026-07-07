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
        Schema::create('document_requirements', function (Blueprint $table) {
            $table->id();
            $table->enum("program_type",['SETUP','GIA']);
            $table->string("requirement_name",255);
            $table->text("description")->nullable();
            $table->boolean("is_mandatory")->default(true);
            $table->integer("sort_order")->default(0);
            $table->boolean("is_active")->default(true);
            $table->integer("years_in_operation");
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_requirements');
    }
};
