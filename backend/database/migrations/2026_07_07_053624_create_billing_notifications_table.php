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
        Schema::create('billing_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId("amortization_id")->constrained("setup_amortization_schedules")->onDelete("set null");
            $table->foreignId("sent_to")->constrained("users")->onDelete("set null");
            $table->enum("notification_type",['UPCOMING_PAYMENT','PAYMENT_DUE','OVERDUE_ALERT','PAYMENT_CONFIRMED']);
            $table->integer("installment_number");
            $table->decimal("amount_due",15,2);
            $table->date("due_date");
            $table->integer("days_until_due")->nullable();
            $table->integer("days_overdue")->nullable();
            $table->timestamp("sent_at")->useCurrent();
            $table->boolean("is_acknowledged")->default(false);
            $table->timestamp("acknowledged_at")->useCurrent()->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('billing_notifications');
    }
};
