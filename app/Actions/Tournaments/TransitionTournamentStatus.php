<?php

namespace App\Actions\Tournaments;

use App\Enums\TournamentStatus;
use App\Models\Tournament;
use RuntimeException;

class TransitionTournamentStatus
{
    /**
     * Move a tournament to a new status, enforcing forward-only progression
     * and per-step guards.
     */
    public function handle(Tournament $tournament, TournamentStatus $next): Tournament
    {
        $current = $tournament->status;

        if ($next === $current) {
            return $tournament;
        }

        if ($next->order() < $current->order()) {
            throw new RuntimeException(__('Tournament status cannot be moved backward.'));
        }

        if ($next->order() !== $current->order() + 1) {
            throw new RuntimeException(__('Tournament status must progress one step at a time.'));
        }

        $this->ensureGuardsPass($tournament, $current, $next);

        $tournament->update(['status' => $next]);

        return $tournament->fresh();
    }

    /**
     * Throw if the requested transition is not allowed given current state.
     */
    protected function ensureGuardsPass(Tournament $tournament, TournamentStatus $from, TournamentStatus $to): void
    {
        if ($from === TournamentStatus::Draft && $to === TournamentStatus::RegistrationOpen) {
            if ($tournament->categories()->count() === 0) {
                throw new RuntimeException(__('At least one category is required before opening registration.'));
            }
        }

        // Additional guards are added by later phases:
        // - registration_closed: requires teams per category (Phase 3)
        // - in_progress: requires brackets finalized (Phase 4)
        // - completed: requires all matches finished (Phase 5/6)
    }
}
