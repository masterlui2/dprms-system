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
        Schema::create('proposal_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId("proposal_id")->constrained("proposals")->onDelete("set null");
            $table->foreignId("commented_by")->constrained("users")->onDelete("set null");
            $table->foreignId("parent_comment_id")->nullable()->constrained("proposal_comments")->onDelete("set null");
            $table->enum("comment_type",["GENERAL","CLARIFICATION_REQUEST","REVISION_REQUEST","TECHNICAL_NOTE"]);
            $table->text("content");
            $table->boolean("is_internal")->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proposal_comments');
    }
};
