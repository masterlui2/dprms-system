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
        Schema::create('ml_models', function (Blueprint $table) {
            $table->id();
            $table->foreignId("dataset_id")->constrained("ml_datasets")->onDelete("set null");
            $table->foreignId("trained_by")->constrained("users")->onDelete("set null");
            $table->string("model_version",50)->unique();
            $table->string("model_name",255);
            $table->jsonb("hyperparameters");
            $table->integer("n_estimators");
            $table->integer("max_depth")->nullable();
            $table->decimal("train_test_split",5,2)->default(80);
            $table->integer("training_records");
            $table->integer("testing_records");
            $table->string("model_file_path",500);
            $table->boolean("is_active")->default(false);
            $table->boolean("is_deployed")->default(false);
            $table->timestamp("deployed_at")->nullable();
            $table->foreignId("deployed_by")->nullable()->constrained("users")->onDelete("set null");
            $table->foreignId("replaced_by")->nullable()->constrained("ml_models")->onDelete("set null");
            $table->integer("training_duration_sec")->nullable();
            $table->enum("status",['TRAINING','TRAINED','EVALUATED','DEPLOYED','RETIRED']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ml_models');
    }
};
