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
        Schema::create('non_compliance_notices', function (Blueprint $table) {
            $table->id();
            $table->foreignId("monitoring_record_id")->constrained("project_monitoring_records")->onDelete("set null");
            $table->foreignId("issued_by")->constrained("users")->onDelete("set null");
            $table->foreignId("compliance_record_id")->constrained("compliance_records")->onDelete("set null");
            $table->string("notice_reference",100)->unique()->nullable();
            $table->enum("notice_type",['WARNING','FORMAL_NOTICE','FINAL_NOTICE','SUSPENSION_NOTICE']);
            $table->string("subject",255);
            $table->text("content");
            $table->timestamp("issued_at")->useCurrent();
            $table->date("response_deadline")->nullable();
            $table->boolean("is_acknowledged")->default(false);
            $table->timestamp("acknowledged_at")->nullable();
            $table->string("notice_path",500)->nullable();
            $table->timestamps();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('non_compliance_notices');
    }
};
