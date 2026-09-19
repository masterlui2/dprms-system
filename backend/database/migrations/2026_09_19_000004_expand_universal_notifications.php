<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->foreignId('actor_id')->nullable()->after('user_id')->constrained('users')->nullOnDelete();
            $table->string('actor_name')->nullable()->after('actor_id');
            $table->string('actor_role')->nullable()->after('actor_name');
            $table->string('category', 40)->default('SYSTEM')->after('type');
            $table->string('program', 10)->nullable()->after('category');
            $table->index(['user_id', 'is_read', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'is_read', 'created_at']);
            $table->dropConstrainedForeignId('actor_id');
            $table->dropColumn(['actor_name', 'actor_role', 'category', 'program']);
        });
    }
};
