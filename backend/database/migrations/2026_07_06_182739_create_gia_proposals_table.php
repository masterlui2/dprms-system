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
        Schema::create('gia_proposals', function (Blueprint $table) {
            $table->id();
            $table->foreignId("proposal_id")->unique()->constrained("proposals")->onDelete("set null");
            $table->enum("proponent_category",['Private Sector','Higher Education Institution','Barangay LGU']);
            $table->string("organization_name", 255);
            $table->text('office_address');
            $table->string("position",255);
            $table->string("contact_number",30);

            // "Capability Building and Training" (singular "Capability") —
            // was "Capabilities Building and Training", which didn't match
            // GiaProposalSubmissionRequest's project_type validation rule or
            // the frontend's giaProjectTypes list, so that option would
            // always fail this column's check constraint on insert.
            $table->enum("research_type",["Research and Development","Capability Building and Training", "Technology Transfer",'Community-Based Science and Technology Project',"Others"]);
            $table->enum("research_category",['Agriculture and Fisheries','Community Development','Education','Environment','Health','Information and Communications Technology','Research and Development','Disaster Risk Reduction and Management','Others']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gia_proposals');
    }
};
