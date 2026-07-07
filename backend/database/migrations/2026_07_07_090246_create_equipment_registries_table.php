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
        Schema::create('equipment_registries', function (Blueprint $table) {
            $table->id();
            $table->foreignId("proposal_id")->constrained("proposals")->onDelete("set null");
            $table->foreignId("category_id")->constrained("equipment_categories")->onDelete("set null");
            $table->foreignId("added_by")->constrained("users")->onDelete("set null");
            $table->enum("program_type",['SETUP','GIA']);
            $table->string("equipment_name",255);
            $table->string("brand",255)->nullable();
            $table->string("model",255)->nullable();
            $table->string("serial_number",255)->nullable();
            $table->decimal("acquisition_cost",15,2);
            $table->date("acquisition_date");
            $table->string("supplier_name",255)->nullable();
            $table->text("specifications")->nullable();
            $table->enum("status",['AVAILABLE','ISSUED','RETURNED','CONDEMNED','LOST','TRANSFERRED']);
            $table->enum("current_condition",['GOOD','FAIR','POOR','NON_FUNCTIONAL'])->default('GOOD');
            $table->foreignId("approved_by")->nullable()->constrained("users")->onDelete("set null");
            $table->timestamp("approved_at")->useCurrent()->nullable();
            $table->text("notes")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('equipment_registries');
    }
};
