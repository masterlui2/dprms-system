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
        Schema::create('workflow_stages', function (Blueprint $table) {
            $table->id();
            $table->enum("program_type",['SETUP','GIA']);
            $table->string("stage_code",100)->unique();
            $table->string("stage_name",255);
            $table->integer("stage_order");
            $table->string("responsible_role",100);
            $table->text("description")->nullable();
            $table->boolean("is_terminal")->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workflow_stages');
    }
};
