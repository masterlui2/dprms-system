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
        Schema::create('equipment_qr_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId("equipment_id")->unique()->constrained("equipment_registries")->onDelete("set null");
            $table->string("qr_code_reference",255)->unique();
            $table->text("qr_code_data");
            $table->string("qr_code_image_path",500);
            $table->integer("version")->default(1);
            $table->boolean("is_active")->default(true);
            $table->timestamp("generated_at")->useCurrent();
            $table->foreignId("generated_by")->constrained("users")->onDelete("set null");
            $table->timestamp("deactivated_at")->useCurrent()->nullable();
            $table->foreignId("deactivated_by")->nullable()->constrained("users")->onDelete("set null");
            $table->text("deactivation_reason")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('equipment_qr_codes');
    }
};
