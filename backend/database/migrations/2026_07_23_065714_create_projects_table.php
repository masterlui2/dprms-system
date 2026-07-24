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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId("proposal_id")->unique()->constrained("proposals")->restrictOnDelete();
            $table->foreignId("created_by")->constrained("users")->restrictOnDelete();
            $table->foreignId("approved_by")->constrained("users")->restrictOnDelete();
            $table->enum("program_type",['SETUP','GIA']);
            $table->enum("status",['active','completed','terminated','archieved'])->default('active');
            $table->date("start_date")->nullable();
            $table->date("expected_end_date")->nullable();
            $table->date("actual_end_date")->nullable();
            $table->text("notes")->nullable();
            $table->timestamp("approved_at")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
