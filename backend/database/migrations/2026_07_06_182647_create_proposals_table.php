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
        Schema::create('proposals', function (Blueprint $table) {
            $table->id();
            $table->foreignId("submitted_by")->constrained("users")->onDelete("set null");
            $table->enum("program_type",['SETUP','GIA']);
            $table->string("reference_number",100)->unique();
            $table->string("title",500);
            $table->enum("status",["DRAFT","SUBMITTED","UNDER_VALIDATION","ENDORSED_TO_PMO","UNDER_SCREENING","ENDORSED_TO_RTEC","UNDER_EVALUATION","ENDORSED_TO_DIRECTOR","APPROVED","DISAPPROVED","RETURNED"]);
            $table->string("current_stage",100);
            $table->timestamp("submitted_at")->nullable();
            $table->timestamp("approved_at")->nullable();
            $table->timestamp("disapproved_at")->nullable();
            $table->text("remarks")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proposals');
    }
};
