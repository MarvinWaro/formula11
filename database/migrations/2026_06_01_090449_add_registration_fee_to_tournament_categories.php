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
        Schema::table('tournament_categories', function (Blueprint $table) {
            $table->decimal('registration_fee', 10, 2)->nullable()->after('max_teams');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tournament_categories', function (Blueprint $table) {
            $table->dropColumn('registration_fee');
        });
    }
};
