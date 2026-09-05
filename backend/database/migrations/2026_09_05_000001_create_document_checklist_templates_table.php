<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_checklist_templates', function (Blueprint $table) {
            $table->id();
            $table->enum('program_type', ['SETUP', 'GIA']);
            $table->string('phase_code', 32);
            $table->string('phase_title', 255);
            $table->string('item_code', 64)->unique();
            $table->string('document_name', 500);
            $table->string('group_name', 255);
            $table->boolean('is_mandatory')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->json('applicability_rules')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['program_type', 'phase_code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_checklist_templates');
    }
};
