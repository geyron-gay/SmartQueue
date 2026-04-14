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
   // In the migration file
public function up()
{
    Schema::table('queue_sessions', function (Blueprint $table) {
        $table->integer('batch_size')->default(1)->after('is_full_auto');
    });
}

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('queue_sessions', function (Blueprint $table) {
            //
        });
    }
};
