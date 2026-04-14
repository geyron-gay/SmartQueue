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
    Schema::table('purposes', function (Blueprint $table) {
        // The core time allowed for this transaction (in minutes)
        $table->integer('default_service_time')->default(5);

        // A 'grace period' before the auto-call actually triggers (in minutes)
        // This prevents the system from calling the next student the exact 
        // second the timer hits zero if the staff is just finishing up.
        $table->integer('buffer_time')->default(2);
        
        // Optional: Max time a staff can extend (to prevent infinite loops)
        $table->integer('max_extension_limit')->default(20);
    });
}

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('purposes', function (Blueprint $table) {
            //
        });
    }
};
