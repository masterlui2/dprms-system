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
        Schema::create('gia_deliverable_tracking', function (Blueprint $table) {
            $table->id();
            $table->foreignId("monitoring_record_id")->constrained("project_monitoring_records")->onDelete("set null");
            $table->integer("deliverable_number");
            $table->string("deliverable_title",255);
            $table->text("deliverable_desription")->nullable();
            $table->date("expected_completion");
            $table->date("actual_completion")->nullable();
            $table->enum("status",['PENDING','IN_PROGRESS','COMPLETED','DELAYED','CANCELLED']);
            $table->decimal("completion_percentage",5,2)->default(0);
            $table->string("supporting_doc_path",500)->nullable();
            $table->foreignId("updated_by")->nullable()->constrained("users")->onDelete("set null");
            $table->text("notes")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gia_deliverable_tracking');
    }
};
