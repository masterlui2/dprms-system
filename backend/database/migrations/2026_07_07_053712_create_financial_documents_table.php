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
        Schema::create('financial_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId("project_budget_id")->constrained("project_budgets")->onDelete("set null");
            $table->foreignId("uploaded_by")->constrained("users")->onDelete("set null");
            $table->enum("document_type",['OFFICIAL_RECEIPT','DISBURSEMENT_VOUCHER','LIQUIDATION_REPORT','BILLING_STATEMENT','PAYMENT_RECEIPT','OTHER']);
            $table->string("document_reference",100)->nullable();
            $table->string("file_name",255);
            $table->string("file_path",500);
            $table->bigInteger("file_size");
            $table->string("mime_type",100);
            $table->string("period_covered",100)->nullable();
            $table->decimal("amount",15,2)->nullable();
            $table->timestamp("uploaded_at")->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('financial_documents');
    }
};
