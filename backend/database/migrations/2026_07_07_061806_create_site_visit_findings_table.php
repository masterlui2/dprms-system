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
        Schema::create('site_visit_findings', function (Blueprint $table) {
            $table->id();
            $table->foreignId("site_visit_id")->unique()->constrained("site_visits")->onDelete("set null");
            $table->foreignId("encoded_by")->constrained("users")->onDelete("set null");
            $table->enum("equipment_condition",['GOOD','FAIR','POOR','NON-FUNCTIONAL'])->nullable();
            $table->enum("business_operations",['OPERATIONAL','PARTIALLY_OPERATIONAL','NON_OPERATIONAL']);
            $table->enum("compliance",['COMPLIANT','PARTIALLY_COMPLIANT','NON_COMPLIANT']);
            $table->text("finding_summary");
            $table->text("recommendations")->nullable();
            $table->text("issues_found")->nullable();
            $table->jsonb("photos_path")->nullable();
            $table->timestamp("encoded_at")->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('site_visit_findings');
    }
};
