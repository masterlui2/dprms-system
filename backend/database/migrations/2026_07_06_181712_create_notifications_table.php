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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId("user_id")->constrained("users")->onDelete("set null");
            $table->string("type",255);
            $table->string("title",255);
            $table->text("message");
            $table->boolean("is_read")->default(false);
            $table->timestamp("read_at")->useCurrent()->nullable();
            $table->string("related_type",100)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
