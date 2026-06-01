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
        Schema::create('tournament_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tournament_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->string('division', 16);
            $table->string('skill_level', 32);
            $table->unsignedSmallInteger('rr_points_to_win')->default(11);
            $table->unsignedSmallInteger('elim_points_to_win')->default(15);
            $table->unsignedSmallInteger('bracket_size')->default(4);
            $table->unsignedSmallInteger('teams_advancing_per_bracket')->default(1);
            $table->unsignedSmallInteger('max_teams')->nullable();
            $table->string('status', 32)->default('registration');
            $table->timestamps();

            $table->unique(['tournament_id', 'slug']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tournament_categories');
    }
};
