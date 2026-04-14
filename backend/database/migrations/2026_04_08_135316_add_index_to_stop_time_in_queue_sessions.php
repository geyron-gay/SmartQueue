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
    Schema::table('queue_sessions', function (Blueprint $table) {
        $table->index(['is_active', 'stop_time_at'], 'idx_active_stop_time');
    });
}

public function down()
{
    Schema::table('queue_sessions', function (Blueprint $table) {
        $table->dropIndex('idx_active_stop_time');
    });
}
};
