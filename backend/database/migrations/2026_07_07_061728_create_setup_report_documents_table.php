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
        Schema::create('setup_report_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId("progress_report_id")->constrained("setup_progress_reports")->onDelete("set null");
            $table->foreignId("uploaded_by")->constrained("users")->onDelete("set null");
            $table->string("document_type",100);
            $table->string("file_name",255);
            $table->string("file_path",500);
            $table->bigInteger("file_size");
            $table->string("mime_type",100);
            $table->timestamp("uploaded_at")->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('setup_report_documents');
    }
};
