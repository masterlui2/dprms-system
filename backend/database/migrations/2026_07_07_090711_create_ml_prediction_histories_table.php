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
        Schema::create('ml_prediction_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId("proposal_id")->constrained("proposals")->onDelete("set null");
            $table->foreignId("lastest_prediction_id")->constrained("ml_predictions")->onDelete("set null");
            $table->enum("previous_growth",['EXPANDING','STABLE','DECLINING'])->nullable();
            $table->enum("current_growth",['EXPANDING','STABLE','DECLINING']);
            $table->enum("previous_sustainability",['SUSTAINABLE','MODERATELY_SUSTAINABLE','UNSUSTAINABLE'])->nullable();
            $table->enum("current_sustainability",['SUSTAINABLE','MODERATELY_SUSTAINABLE','UNSUSTAINABLE']);
            $table->enum("previous_renewal",['RENEWAL_RECOMMENDED','NEEDS_INTERVENTION','AT_RISK'])->nullable();
            $table->enum("current_renewal",['RENEWAL_RECOMMENDED','NEEDS_INTERVENTION','AT_RISK']);
            $table->boolean("growth_changed")->default(false);
            $table->boolean("sustainability_changed")->default(false);
            $table->boolean("renewal_changed")->default(false);
            $table->string("evaluation_period",100);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ml_prediction_histories');
    }
};
