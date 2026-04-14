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
        // We use boolean which Laravel maps to TINYINT(1)
        $table->boolean('is_autocall_enabled')->default(false)->after('is_active');
    });
}

public function down(): void
{
    Schema::table('queue_sessions', function (Blueprint $table) {
        $table->dropColumn('is_autocall_enabled');
    });
}
};
