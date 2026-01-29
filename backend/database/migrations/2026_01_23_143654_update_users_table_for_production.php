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
    public function up() {
    Schema::table('users', function (Blueprint $table) {
        $table->string('student_id')->nullable()->unique()->after('email');
        $table->string('user_type')->default('student'); // 'student', 'visitor', 'staff'
    });
}

    /**
     * Reverse the migrations.
     *
     * @return void
     */
   public function down()
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropColumn(['student_id', 'user_type']);
    });
}
};