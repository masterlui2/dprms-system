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
        Schema::create('proposal_audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proposal_id')->constrained("proposals")->restrictOnDelete();
            $table->foreignId('reviewed_by')->constrained("users")->restrictOnDelete();
            $table->string('action',50);
            $table->string('previous_status',100);
            $table->string('new_status',100);
            $table->text("remarks")->nullable();
            $table->string("findings")->nullable();
            $table->foreignId('assigned_evaluator_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proposal_audits');
    }
};
