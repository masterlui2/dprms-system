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
        Schema::create('generated_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId("report_template_id")->constrained("report_templates")->onDelete("set null");
            $table->foreignId("generated_by")->constrained("users")->onDelete("set null");
            $table->foreignId("proposal_id")->nullable()->constrained("proposals")->onDelete("set null");
            $table->string("report_reference",100)->unique();
            $table->string("report_title",255);
            $table->enum("program_type",['SETUP','GIA','BOTH']);
            $table->string("report_category",100);
            $table->jsonb("parameters_used")->nullable();
            $table->date("data_range_from")->nullable();
            $table->date("data_range_to")->nullable();
            $table->string("province_filter",100)->nullable();
            $table->string("status_filter",100)->nullable();
            $table->enum("output_format",['PDF','EXCEL','CSV']);
            $table->string("file_name",255);
            $table->string("file_path",500);
            $table->bigInteger("file_size");
            $table->string("mime_type",100);
            $table->integer("page_count")->nullable();
            $table->integer("record_count")->nullable();
            $table->timestamp("generated_at")->useCurrent();
            $table->timestamp("expires_at")->nullable();
            $table->boolean("is_scheduled")->default("false");
            $table->foreignId("scheduled_id")->nullable()->constrained("report_schedules")->onDelete("set null");
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('generated_reports');
    }
};
