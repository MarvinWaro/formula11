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
        Schema::table('matches', function (Blueprint $table) {
            $table->foreignUuid('scored_by_user_id')->nullable()->after('played_at')->constrained('users')->nullOnDelete();
            $table->timestamp('scored_at')->nullable()->after('scored_by_user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('matches', function (Blueprint $table) {
            $table->dropConstrainedForeignId('scored_by_user_id');
            $table->dropColumn('scored_at');
        });
    }
};
