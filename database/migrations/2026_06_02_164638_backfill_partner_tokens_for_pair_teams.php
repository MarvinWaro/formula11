<?php

use App\Models\TournamentTeam;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Generate a partner_token for any team that still has a placeholder
     * Player 2 (user_id=null, is_captain=false) but no token yet. Older
     * pair registrations were created before tokens were universal.
     */
    public function up(): void
    {
        TournamentTeam::query()
            ->whereNull('partner_token')
            ->whereHas('players', fn ($q) => $q
                ->whereNull('user_id')
                ->where('is_captain', false))
            ->get(['id'])
            ->each(function (TournamentTeam $team): void {
                $team->update(['partner_token' => (string) Str::ulid()]);
            });
    }

    public function down(): void
    {
        // No safe reverse — we'd be unable to distinguish which tokens were
        // backfilled vs created at registration time. Intentional no-op.
    }
};
