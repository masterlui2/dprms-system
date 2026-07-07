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
        Schema::create('gia_co_authors', function (Blueprint $table) {
            $table->id();
            $table->foreignId("gia_proposal_id")->constrained("gia_proposals")->onDelete("set null");
            $table->string("name",255)->nullable();
            $table->string("designation",255)->nullable();
            $table->string("institution",255)->nullable();
            $table->string("email",255)->nullable();
            $table->string("contact_number",50)->nullable();
            $table->string("cv_path",500)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gia_co_authors');
    }
};
