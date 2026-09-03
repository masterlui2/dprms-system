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
            $table->dropForeign(['tna_encoded_by']);
        });

        Schema::table('setup_proposals', function (Blueprint $table) {
            $table->dropColumn("dti_sec_number");
            $table->dropColumn("annual_revenue");
            $table->dropColumn("tna_encoded_at");
            $table->dropColumn("tna_encoded_by");
            $table->dropColumn("lgu_permit_number");
            $table->dropColumn("letter_of_intent_path");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('setup_proposals', function (Blueprint $table) {
            $table->string("dti_sec_number",100);
            $table->decimal("annual_revenue",15,2)->nullable();
            $table->timestamp("tna_encoded_at")->useCurrent()->nullable();
            $table->foreignId("tna_encoded_by")->nullable()->constrained("users")->onDelete("set null");
            $table->string("lgu_permit_number",100)->nullable();
            $table->string("letter_of_intent_path",500)->nullable();
        });
    }
};
