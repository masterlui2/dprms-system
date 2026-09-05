<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proposal_checklist_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proposal_id')->constrained('proposals')->cascadeOnDelete();
            $table->foreignId('template_item_id')->constrained('document_checklist_templates')->cascadeOnDelete();
            $table->foreignId('document_id')->nullable()->constrained('documents')->nullOnDelete();
            $table->boolean('is_present')->default(false);
            $table->enum('status', ['Missing', 'Under Review', 'Complied', 'Needs Revision'])->default('Missing');
            $table->text('remarks')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->unique(['proposal_id', 'template_item_id'], 'uq_proposal_template_item');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proposal_checklist_reviews');
    }
};
