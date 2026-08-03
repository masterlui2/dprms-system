<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('document_types', function (Blueprint $table) {
            $table->string('group', 100)->nullable()->after('name');
            $table->text('description')->nullable()->after('group');
            $table->json('applicable_business_types')->nullable()->after('applicable_program');
            $table->json('applicable_gia_categories')->nullable()->after('applicable_business_types');
            $table->boolean('is_applicant_visible')->default(true)->after('is_required');
            $table->text('instructions')->nullable()->after('description');
            $table->string('template_url', 500)->nullable()->after('instructions');
            $table->json('applicable_business_sizes')->nullable()->after('applicable_business_types');
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->unique(['proposal_id', 'document_type_id']);
        });
    }

    public function down(): void
    {
        Schema::table('document_types', function (Blueprint $table) {
            $table->dropColumn([
                'group',
                'description',
                'applicable_business_types',
                'applicable_gia_categories',
                'is_applicant_visible',
                'instructions',
                'template_url',
                'applicable_business_sizes'
            ]);
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->dropUnique(['proposal_id', 'document_type_id']);
        });
    }
};
