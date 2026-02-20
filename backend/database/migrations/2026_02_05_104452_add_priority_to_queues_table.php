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
        // String to show on the UI (e.g., "Regular" or "Priority")
        $table->string('priority')->default('Regular')->after('purpose');
        
        // Integer for the database to sort (0 = Normal, 1 = VIP/PWD)
        $table->integer('priority_level')->default(0)->after('priority');
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
