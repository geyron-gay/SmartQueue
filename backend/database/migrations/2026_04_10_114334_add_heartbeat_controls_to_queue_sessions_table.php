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
    Schema::table('queue_sessions', function (Blueprint $table) {
        // Enables the "Heartbeat" timer logic
        $table->boolean('is_full_auto')->default(false)->after('is_autocall_enabled');

        // The Pause Controls
        $table->boolean('is_paused')->default(false)->after('is_full_auto');
        $table->timestamp('paused_at')->nullable()->after('is_paused');
    });
}

public function down(): void
{
    Schema::table('queue_sessions', function (Blueprint $table) {
        $table->dropColumn(['is_full_auto', 'is_paused', 'paused_at']);
    });
}
};
