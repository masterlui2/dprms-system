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
        Schema::create('ml_datasets', function (Blueprint $table) {
            $table->id();
            $table->foreignId("created_by")->constrained("users")->onDelete("set null");
            $table->string("dataset_version",50)->unique();
            $table->text("description")->nullable();
            $table->integer("record_count");
            $table->integer("feature_count");
            $table->date("data_range_from")->nullable();
            $table->date("data_range_to")->nullable();
            $table->jsonb("features_schema");
            $table->jsonb("preprocessing_steps")->nullable();
            $table->string("dataset_path",500);
            $table->boolean("is_active")->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ml_datasets');
    }
};
