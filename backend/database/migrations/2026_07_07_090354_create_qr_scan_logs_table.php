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
        Schema::create('qr_scan_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId("qr_code_id")->constrained("equipment_qr_codes")->onDelete("set null");
            $table->foreignId("scanned_by")->constrained("users")->onDelete("set null");
            $table->enum("scan_purpose",['ISSUANCE','RETURN','CONDITION_CHECK','VERIFICATION','GENERAL_INQUIRY']);
            $table->enum("scan_result",['SUCCESS','INVALID_CODE','DEACTIVATED_CODE','ERROR']);
            $table->string("device_type",100)->nullable();
            $table->string("browser",100)->nullable();
            $table->string("ip_address",45)->nullable();
            $table->decimal("location_lat",10,8)->nullable();
            $table->decimal("location_lng",11,8)->nullable();
            $table->string("action_taken",255)->nullable();
            $table->timestamp("scanned_at")->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('qr_scan_logs');
    }
};
