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
    public function up()
    {
        Schema::create('no_show_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->foreignId('queue_id')->constrained('queues'); // The specific ticket they missed
    $table->string('department'); // Denormalized for quick reporting
    $table->foreignId('staff_id')->constrained('users'); // Who caught them?
    $table->timestamps(); // This gives us 'created_at' for the daily reset logic
});
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('no_show_logs_table');
    }
};
