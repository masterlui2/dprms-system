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
        Schema::create('employee', function (Blueprint $table) {
            $table->id();
            $table->foreignId("quarter_id")->constrained("quarterly_metrics")->restrictOnDelete();
            $table->string("employee_name",100);
            $table->integer("age");
            $table->enum('status',['Regular','Contract-Based','Part-Timer','Project-Based']);
            $table->enum('gender',['Male','Female']);
            $table->enum('sectoral_group',['None','PWD','Senior']);
            $table->integer('days_of_attendance')->default(0);
            $table->decimal('salary_rate',15,2)->default(0);
            $table->decimal('total_salary',15,2)->storedAs('salary_rate * days_of_attendance');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee');
    }
};
