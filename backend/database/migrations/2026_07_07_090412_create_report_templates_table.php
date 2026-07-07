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
        Schema::create('report_templates', function (Blueprint $table) {
            $table->id();
            $table->string("template_code")->unique();
            $table->string("template_name",255);
            $table->enum("program_type",['SETUP','GIA','BOTH']);
            $table->enum('report_category',['FINANCIAL','COMPLIANCE','PERFORMANCE','EQUIPMENT','EVALUATION','AUDIT']);
            $table->jsonb("allowed_roles");
            $table->text("description")->nullable();
            $table->jsonb("ouput_formats");
            $table->jsonb("parameters_schema")->nullable();
            $table->boolean("is_active")->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_templates');
    }
};
