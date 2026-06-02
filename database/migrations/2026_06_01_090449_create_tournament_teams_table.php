<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tournament_teams', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tournament_category_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('hei_id')->nullable()->constrained('heis')->nullOnDelete();
            $table->string('display_name');
            $table->string('captain_email');
            $table->string('captain_phone', 32)->nullable();
            $table->string('status', 16)->default('active')->index();
            $table->unsignedSmallInteger('seed')->nullable();
            $table->timestamp('withdrawn_at')->nullable();
            $table->timestamps();

            $table->index(['tournament_category_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tournament_teams');
    }
};
