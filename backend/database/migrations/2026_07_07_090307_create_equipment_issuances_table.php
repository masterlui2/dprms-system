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
        Schema::create('equipment_issuances', function (Blueprint $table) {
            $table->id();
            $table->foreignId("equipment_id")->constrained("equipment_registries")->onDelete("set null");
            $table->foreignId("proposal_id")->constrained("proposals")->onDelete("set null");
            $table->foreignId("issued_to")->constrained("users")->onDelete("set null");
            $table->foreignId("issued_by")->constrained("users")->onDelete("set null");
            $table->date("issuance_date");
            $table->string("issuance_reference",100)->unique();
            $table->enum("condition_at_issuance",['GOOD','FAIR','POOR']);
            $table->date("expected_return_date")->nullable();
            $table->string("receipt_path",500)->nullable();
            $table->boolean("scanned_via_qr")->default(false);
            $table->foreignId("qr_code_id")->nullable()->constrained("equipment_qr_codes")->onDelete("set null");
            $table->text("notes")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('equipment_issuances');
    }
};
