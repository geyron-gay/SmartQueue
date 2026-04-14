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
        // Add the expiry timestamp for the heartbeat
        $table->timestamp('expires_at')->nullable()->after('completed_at');

        // Add foreign key to purposes table
        $table->foreignId('purpose_id')->nullable()->constrained('purposes')->onDelete('set null');
    });
}

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('queues', function (Blueprint $table) {
            //
        });
    }
};
