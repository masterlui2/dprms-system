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
        Schema::create('equipment_returns', function (Blueprint $table) {
            $table->id();
            $table->foreignId("issuance_id")->unique()->constrained("equipment_issuances")->onDelete("set null");
            $table->foreignId("equipment_id")->constrained("equipment_registries")->onDelete("set null");
            $table->foreignId("returned_by")->constrained("users")->onDelete("set null");
            $table->foreignId("received_by")->constrained("users")->onDelete("set null");
            $table->date("return_date");
            $table->string("return_reference")->unique();
            $table->enum("condition_at_return",['GOOD','FAIR','POOR','NON_FUNCTIONAL']);
            $table->boolean("condition_changed")->default(false);
            $table->text("damage_description")->nullable();
            $table->string("receipt_path",500)->nullable();
            $table->boolean("scanned_via_qr")->default(false);
            $table->foreignId("qr_code_id")->nullable()->constrained("equipment_qr_codes")->onDelete("set null");
            $table->text("notes");
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('equipment_returns');
    }
};
