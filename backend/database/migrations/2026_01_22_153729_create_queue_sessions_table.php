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
    Schema::create('queue_sessions', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained(); // The Staff member
        $table->string('department'); // e.g., 'IT Registrar'
        $table->string('target_year'); // e.g., '3rd Year' or 'All'
        $table->integer('capacity_limit'); // e.g., 50
        $table->integer('current_count')->default(0);
        $table->boolean('is_active')->default(true); // Toggle the "Open/Closed"
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
        Schema::dropIfExists('queue_sessions');
    }
};
