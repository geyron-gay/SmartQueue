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
    Schema::create('broadcasts', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Who sent it
        $table->string('message');
        $table->enum('type', ['info', 'warning', 'emergency'])->default('info');
        $table->string('department'); // Which office is announcing
        $table->boolean('is_active')->default(true); // Can be toggled off to hide it
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
        Schema::dropIfExists('broadcasts');
    }
};
