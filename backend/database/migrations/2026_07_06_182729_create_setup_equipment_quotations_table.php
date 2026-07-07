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
        Schema::create('setup_equipment_quotations', function (Blueprint $table) {
            $table->id();
            $table->foreignId("setup_proposal_id")->constrained("setup_proposals")->onDelete("set null");
            $table->integer("quotation_number");
            $table->string("supplier_name",255);
            $table->text("supplier_address")->nullable();
            $table->text("equipment_description");
            $table->integer("quantity");
            $table->decimal("unit_price",15,2);
            $table->decimal("total_price",15,2);
            $table->string("currency",10)->default("PHP");
            $table->date("quotation_date")->nullable();
            $table->string("validity_period",100)->nullable();
            $table->string("file_path",500)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('setup_equipment_quotations');
    }
};
