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
    Schema::create('priority_verifications', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->onDelete('cascade');
        $table->string('file_path');
        $table->enum('priority_type', ['senior', 'pwd', 'pregnant', 'regular'])->nullable();
        $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
        $table->foreignId('reviewed_by')->nullable(); // admin/staff
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
        Schema::dropIfExists('priority_verifications');
    }
};
