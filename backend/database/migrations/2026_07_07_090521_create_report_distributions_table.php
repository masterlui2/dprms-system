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
        Schema::create('report_distributions', function (Blueprint $table) {
            $table->id();
            $table->foreignId("generated_report_id")->constrained("generated_reports")->onDelete("set null");
            $table->foreignId("distributed_to")->constrained("users")->onDelete("set null");
            $table->enum("distribution_method",['EMAIL','SYSTEM_NOTIFICATION','BOTH']);
            $table->timestamp("distributed_at")->nullable();
            $table->boolean("is_delivered")->default(false);
            $table->timestamp("delivered_at")->useCurrent()->nullable();
            $table->text("delivery_error")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_distributions');
    }
};
