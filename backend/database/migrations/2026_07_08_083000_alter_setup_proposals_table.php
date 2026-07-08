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
        Schema::table('setup_proposals', function (Blueprint $table) {
            $table->dropForeign(["proposal_id"]);
        });
        Schema::table('setup_financial_documents', function (Blueprint $table) {
            $table->dropForeign(["setup_proposal_id"]);
            $table->dropColumn("verified_at");
        });
        Schema::table('setup_equipment_quotations', function (Blueprint $table) {
            $table->dropForeign(["setup_proposal_id"]);
            $table->foreign("setup_proposal_id")->references("id")->on("setup_proposals")->cascadeOnDelete();
        });
        Schema::table('gia_proposals', function (Blueprint $table) {
            $table->dropForeign(["proposal_id"]);
            $table->foreign("proposal_id")->unique()->references("id")->on("proposals")->cascadeOnDelete();
        });
        Schema::table('gia_co_authors', function (Blueprint $table) {
            $table->dropForeign(["gia_proposal_id"]);
            $table->foreign("gia_proposal_id")->references("id")->on("gia_proposals")->cascadeOnDelete();
        });
        Schema::table('gia_documents', function (Blueprint $table) {
            $table->dropForeign(["gia_proposal_id"]);
            $table->foreign("gia_proposal_id")->references("id")->on("gia_proposals")->cascadeOnDelete();
        });
        Schema::table('proposal_templates', function (Blueprint $table) {
            $table->dropForeign(["uploaded_by"]);
            $table->foreign("uploaded_by")->references("id")->on("users")->cascadeOnDelete();
        });
        Schema::table('setup_proposals', function (Blueprint $table) {
            $table->foreign("proposal_id")->unique()->references("id")->on("proposals")->restrictOnDelete();
        });
        Schema::table('setup_financial_documents', function (Blueprint $table) {
            $table->foreign("setup_proposal_id")->references("id")->on("setup_proposals")->cascadeOnDelete();
            $table->timestamp("verified_at")->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('setup_proposals', function (Blueprint $table) {
            $table->dropForeign(["proposal_id"]);
        });

        Schema::table('setup_financial_documents', function (Blueprint $table) {
            $table->dropForeign(["setup_proposal_id"]);
            $table->dropColumn("verified_at");
        });

        Schema::table('setup_proposals', function (Blueprint $table) {
            $table->foreign("proposal_id")->unique()->references("id")->on("proposals")->nullOnDelete();
        });
        Schema::table('setup_financial_documents', function (Blueprint $table) {
            $table->foreign("setup_proposal_id")->references("id")->on("setup_proposals")->nullOnDelete();
            $table->timestamp("verified_at")->useCurrent()->nullable();
        });
        Schema::table('setup_equipment_quotations', function (Blueprint $table) {
            $table->dropForeign(["setup_proposal_id"]);
            $table->foreign("setup_proposal_id")->references("id")->on("setup_proposals")->nullOnDelete();
        });
        Schema::table('gia_proposals', function (Blueprint $table) {
            $table->dropForeign(["proposal_id"]);
            $table->foreign("proposal_id")->unique()->references("id")->on("proposals")->nullOnDelete();
        });
        Schema::table('gia_co_authors', function (Blueprint $table) {
            $table->dropForeign(["gia_proposal_id"]);
            $table->foreign("gia_proposal_id")->references("id")->on("gia_proposals")->nullOnDelete();
        });
        Schema::table('gia_documents', function (Blueprint $table) {
            $table->dropForeign(["gia_proposal_id"]);
            $table->foreign("gia_proposal_id")->references("id")->on("gia_proposals")->nullOnDelete();
        });
        Schema::table('proposal_templates', function (Blueprint $table) {
            $table->dropForeign(["uploaded_by"]);
            $table->foreign("uploaded_by")->references("id")->on("users")->nullOnDelete();
        });
    }
};
