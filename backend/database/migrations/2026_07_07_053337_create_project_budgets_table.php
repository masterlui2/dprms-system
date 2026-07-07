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
        Schema::create('project_budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId("proposal_id")->unique()->constrained("proposals")->onDelete("set null");
            $table->foreignId("created_by")->constrained("users")->onDelete("set null");
            $table->enum("program_type",['SETUP','GIA']);
            $table->decimal("total_amount",5,2);
            $table->string("currency",10)->default("PHP");
            $table->integer("fiscal_year");
            $table->decimal("budget_ceiling",5,2)->nullable();
            $table->enum("status",['ACTIVE','COMPLETED','SUSPENDED','CLOSED']);
            $table->text("notes")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_budgets');
    }
};
