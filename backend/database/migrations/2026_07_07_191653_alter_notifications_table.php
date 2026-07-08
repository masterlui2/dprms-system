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
        Schema::table('notifications', function(Blueprint $table){
            $table->dropForeign(['user_id']);
            $table->dropColumn("related_type");
            $table->dropColumn("read_at");
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->foreign("user_id")->references("id")->on("users")->restrictOnDelete();
            $table->nullableMorphs("related");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notifications', function(Blueprint $table){
            $table->dropForeign(['user_id']);
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->foreign("user_id")->references("id")->on("users")->nullOnDelete();
            $table->dropMorphs("related");
            $table->string("related_type",100)->nullable();
            $table->timestamp("read_at")->nullable();
        });
    }
};
