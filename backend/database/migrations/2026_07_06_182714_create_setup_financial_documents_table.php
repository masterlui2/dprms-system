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
        Schema::create('setup_financial_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId("setup_proposal_id")->constrained("setup_proposals")->onDelete("set null");
            $table->enum("document_type",["AUDITED_FINANCIAL_STATEMENT","FINANCIAL_PROJECTION","DTI_SEC_REGISTRATION","LGU_PERMIT","LETTER_OF_INTENT","OTHER"]);
            $table->integer("document_year")->nullable();
            $table->string("file_name",255);
            $table->string("file_path",500);
            $table->bigInteger("file_size");
            $table->string("mime_type",100);
            $table->boolean("is_verified")->default(false);
            $table->foreignId("verified_by")->nullable()->constrained("users")->onDelete("set null");
            $table->timestamp("verified_at")->useCurrent()->nullable();
            $table->timestamp("updated_at")->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('setup_financial_documents');
    }
};
