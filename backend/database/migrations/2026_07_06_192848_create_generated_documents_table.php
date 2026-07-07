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
        Schema::create('generated_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId("proposal_id")->constrained("proposals")->onDelete("set null");
            $table->foreignId("generated_by")->constrained("users")->onDelete("set null");
            $table->enum("document_type",['MOA','GRANT_AWARD','DISAPPROVAL_NOTICE','RETURN_NOTICE','ENDORSEMENT_LETTER']);
            $table->string("document_reference",100)->unique();
            $table->string("file_path",500);
            $table->timestamp("generated_at")->useCurrent();
            $table->boolean("is_final")->default(false);
            $table->timestamp("finalized_at")->useCurrent()->nullable();
            $table->foreignId("finalized_by")->constrained("users")->onDelete("set null");
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('generated_documents');
    }
};
