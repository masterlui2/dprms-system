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
        Schema::create('proposal_workflow_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId("proposal_id")->constrained("proposals")->onDelete("set null");
            $table->foreignId("workflow_stage_id")->constrained("workflow_stages")->onDelete("set null");
            $table->foreignId("acted_by")->constrained("users")->onDelete("set null");
            $table->enum("action",['SUBMITTED','VALIDATED','ENDORSED','SCREENED','ASSIGNED','EVALUATED','RECOMMENDED','APPROVED','DISAPPROVED','RETURNED','COMMENTED']);
            $table->string("from_stage",100)->nullable();
            $table->string("to_stage",100)->nullable();
            $table->text("remarks")->nullable();
            $table->jsonb("attachments")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proposal_workflow_histories');
    }
};
