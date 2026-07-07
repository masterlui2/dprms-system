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
        Schema::create('execom_votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId("proposal_id")->constrained("proposals")->onDelete("set null");
            $table->foreignId("execom_member_id")->constrained("users")->onDelete("set null");
            $table->enum("vote",['APPROVE','DISAPPROVE','ABSTAIN']);
            $table->text("justification")->nullable();
            $table->timestamp("vote_at")->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('execom_votes');
    }
};
