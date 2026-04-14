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
    Schema::table('queues', function (Blueprint $table) {
        // This creates the queue_session_id column 
        // and links it to the 'id' on your queue_sessions table
        $table->foreignId('queue_session_id')
              ->nullable() 
              ->after('user_id')
              ->constrained('queue_sessions')
              ->onDelete('cascade'); 
    });
}

public function down(): void
{
    Schema::table('queues', function (Blueprint $table) {
        $table->dropForeign(['queue_session_id']);
        $table->dropColumn('queue_session_id');
    });
}
};
