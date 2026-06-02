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
        Schema::create('matches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tournament_category_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('pool_id')->nullable()->constrained('pools')->nullOnDelete();
            $table->string('stage', 16)->default('pool'); // pool, semi, bronze, final
            $table->unsignedSmallInteger('sequence')->default(1);
            $table->foreignUuid('team_a_id')->nullable()->constrained('tournament_teams')->nullOnDelete();
            $table->foreignUuid('team_b_id')->nullable()->constrained('tournament_teams')->nullOnDelete();
            $table->unsignedSmallInteger('score_a')->nullable();
            $table->unsignedSmallInteger('score_b')->nullable();
            $table->foreignUuid('winner_team_id')->nullable()->constrained('tournament_teams')->nullOnDelete();
            $table->timestamp('played_at')->nullable();
            $table->timestamps();

            $table->index(['tournament_category_id', 'stage']);
            $table->index(['pool_id', 'sequence']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('matches');
    }
};
