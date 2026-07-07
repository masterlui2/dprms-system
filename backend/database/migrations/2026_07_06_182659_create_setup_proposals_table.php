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
        Schema::create('setup_proposals', function (Blueprint $table) {
            $table->id();
            $table->foreignId("proposal_id")->unique()->constrained("proposals")->onDelete("set null");
            $table->string("business_name",255);
            $table->enum("business_type",["SOLE-PROPRIETORSHIP","PARTNERSHIP","CORPORATION","COOPERATIVE"]);
            $table->string("dti_sec_number",100);
            $table->string("industry_sector",255);
            $table->enum("enterprise_size",["MICRO","SMALL","MEDIUM"]);
            $table->integer("years_in_operation");
            $table->text("business_address");
            $table->string("region",100);
            $table->string("province",100);
            $table->string("city_municipality",100);
            $table->decimal("annual_revenue",15,2)->nullable();
            $table->timestamp("tna_encoded_at")->useCurrent()->nullable();
            $table->foreignId("tna_encoded_by")->nullable()->constrained("users")->onDelete("set null");
            $table->string("lgu_permit_number",100)->nullable();
            $table->string("letter_of_intent_path",500)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('setup_proposals');
    }
};
