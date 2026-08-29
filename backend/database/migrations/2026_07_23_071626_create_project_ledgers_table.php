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
        Schema::create('project_ledgers', function (Blueprint $table) {
            $table->id();
            $table->foreignId("project_id")->constrained("projects")->restrictOnDelete();
            $table->enum("program_type",['SETUP','GIA']);
            $table->enum("ledger_type",['repayment','milestone']);
            $table->string("period_label",100);
            $table->decimal("amount",15,2)->nullable();
            $table->date("due_date");
            $table->enum("status",['pending','paid','overdue','completed'])->default('pending');
            $table->text("notes")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_ledgers');
    }
};
