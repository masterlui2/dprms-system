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
        Schema::create('document_types', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->enum('set_number', ['PROPOSAL','SET1','SET2','SET3']);
            $table->enum('applicable_program', ['SETUP', 'GIA', 'BOTH']);
            $table->boolean('is_required')->default(true);
            $table->timestamps();
        });

        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proposal_id')->constrained('proposals')->restrictOnDelete();
            $table->foreignId('document_type_id')->constrained('document_types')->restrictOnDelete();
            $table->foreignId("uploaded_by")->constrained("users")->restrictOnDelete();
            $table->foreignId("reviewed_by")->nullable()->constrained("users")->nullOnDelete();
            $table->string('file_name', 255);
            $table->string('file_path', 500);
            $table->bigInteger('file_size')->nullable();
            $table->string('mime_type', 100)->nullable();
            $table->enum('status', ['pending', 'approved', 'returned_for_revision'])->default('pending');
            $table->text('remarks')->nullable();
            $table->timestamp("reviewed_at")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
        Schema::dropIfExists('document_types');
    }
};
