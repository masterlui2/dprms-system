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
        Schema::create('equipment_condition_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId("equipment_id")->constrained("equipment_registries")->onDelete("set null");
            $table->foreignId("uploaded_by")->constrained("users")->onDelete("set null");
            $table->foreignId("qr_code_id")->nullable()->constrained("equipment_qr_codes")->onDelete("set null");
            $table->enum("previous_condition",['GOOD','FAIR','POOR','NON_FUNCTIONAL']);
            $table->enum("new_condition",['GOOD','FAIR','POOR','NON_FUNCTIONAL']);
            $table->enum("update_reason",['SITE_VISIT','QR_SCAN','RETURN_INSPECTION','ROUTINE_CHECK']);
            $table->text("remarks")->nullable();
            $table->jsonb("photos_path")->nullable();
            $table->timestamp("scanned_at");
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('equipment_condition_logs');
    }
};
