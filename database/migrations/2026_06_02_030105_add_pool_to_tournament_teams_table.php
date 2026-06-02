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
        Schema::table('tournament_teams', function (Blueprint $table) {
            $table->foreignUuid('pool_id')->nullable()->after('hei_id')->constrained('pools')->nullOnDelete();
            $table->unsignedSmallInteger('pool_seed')->nullable()->after('pool_id');

            $table->index('pool_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tournament_teams', function (Blueprint $table) {
            $table->dropForeign(['pool_id']);
            $table->dropColumn(['pool_id', 'pool_seed']);
        });
    }
};
