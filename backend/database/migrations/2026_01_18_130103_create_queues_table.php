<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up(): void
{
    Schema::create('queues', function (Blueprint $table) {
        $table->id();
        $table->string('student_name');
        $table->string('student_id');
        $table->string('purpose');
        $table->integer('queue_number'); // e.g., 001, 002
        $table->string('status')->default('pending'); // pending, serving, completed
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('queues');
    }
};
