<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tournament_teams', function (Blueprint $table) {
            $table->string('partner_email')->nullable()->after('captain_phone');
            $table->string('partner_token', 26)->nullable()->unique()->after('partner_email');
        });
    }

    public function down(): void
    {
        Schema::table('tournament_teams', function (Blueprint $table) {
            $table->dropUnique(['partner_token']);
            $table->dropColumn(['partner_email', 'partner_token']);
        });
    }
};
