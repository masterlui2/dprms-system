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
        Schema::create('equipment_dispositions', function (Blueprint $table) {
            $table->id();
            $table->foreignId("equipment_id")->unique()->constrained("equipment_registries")->onDelete("set null");
            $table->foreignId("disposed_by")->constrained("users")->onDelete("set null");
            $table->foreignId("authorized_by")->constrained("users")->onDelete("set null");
            $table->enum("disposition_type",['CONDEMNED','WRITTEN OFF','LOST','TRANSFERRED','DONATED']);
            $table->date("disposition_date");
            $table->string("disposition_reference",100)->unique();
            $table->text("reason");
            $table->string("authorization_date",500)->nullable();
            $table->decimal("residual_value",15,2)->default(0);
            $table->string("supporting_doc_path",500)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('equipment_dispositions');
    }
};
