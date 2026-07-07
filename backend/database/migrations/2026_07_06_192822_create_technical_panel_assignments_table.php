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
        Schema::create('technical_panel_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId("proposal_id")->constrained("proposals")->onDelete("set null");
            $table->foreignId("reviewer_id")->constrained("users")->onDelete("set null");
            $table->foreignId("assigned_by")->constrained("users")->onDelete("set null");
            $table->date("assignment_date");
            $table->date("review_deadline")->nullable();
            $table->enum("status",['ASSIGNED','IN_PROGRESS','COMPLETED','DECLINED']);
            $table->boolean("is_blind_review")->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('technical_panel_assignments');
    }
};
