<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('site_visits', function (Blueprint $table) {
            $table->foreignId('project_id')->nullable()->after('id')->constrained('projects')->nullOnDelete();
            $table->time('start_time')->nullable()->after('scheduled_date');
            $table->time('end_time')->nullable()->after('start_time');
            $table->string('purpose')->nullable()->after('visit_type');
            $table->string('facility_location')->nullable()->after('purpose');
            $table->text('proponent_instructions')->nullable()->after('facility_location');
            $table->string('visibility', 20)->default('BROADCAST')->after('proponent_instructions');
        });

        Schema::create('site_visit_assignees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_visit_id')->constrained('site_visits')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['site_visit_id', 'user_id']);
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->timestamp('read_at')->nullable()->after('is_read');
            $table->string('action_url')->nullable()->after('message');
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumn(['read_at', 'action_url']);
        });

        Schema::dropIfExists('site_visit_assignees');

        Schema::table('site_visits', function (Blueprint $table) {
            $table->dropConstrainedForeignId('project_id');
            $table->dropColumn([
                'start_time',
                'end_time',
                'purpose',
                'facility_location',
                'proponent_instructions',
                'visibility',
            ]);
        });
    }
};
