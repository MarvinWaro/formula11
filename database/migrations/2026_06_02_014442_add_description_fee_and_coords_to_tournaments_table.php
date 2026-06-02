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
        Schema::table('tournaments', function (Blueprint $table) {
            $table->text('description')->nullable()->after('venue');
            $table->decimal('registration_fee', 10, 2)->nullable()->after('description');
            $table->decimal('venue_lat', 10, 7)->nullable()->after('venue');
            $table->decimal('venue_lng', 10, 7)->nullable()->after('venue_lat');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tournaments', function (Blueprint $table) {
            $table->dropColumn(['description', 'registration_fee', 'venue_lat', 'venue_lng']);
        });
    }
};
