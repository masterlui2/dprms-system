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
        Schema::create('gia_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId("gia_proposal_id")->constrained("gia_proposals")->onDelete("set null");
            $table->enum("document_type",['CAPSULE_PROPOSAL','FULL_PROPOSAL','CO_AUTHOR_CV','GAD_SCORESHEET','ENDORSEMENT_LETTER',]);
            $table->string("file_name",255);
            $table->string("file_path",500);
            $table->bigInteger("file_size");
            $table->string("mime_type",100);
            $table->boolean("is_verified")->default(false);
            $table->foreignId("verified_by")->nullable()->constrained("users")->onDelete("set null");
            $table->timestamp("verified_at")->useCurrent()->nullable();
            $table->text("verifiation_remarks")->nullable();
            $table->timestamp("updated_at")->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gia_documents');
    }
};
