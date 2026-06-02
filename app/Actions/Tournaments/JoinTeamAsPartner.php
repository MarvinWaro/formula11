<?php

namespace App\Actions\Tournaments;

use App\Models\Tournament;
use App\Models\TournamentTeam;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class JoinTeamAsPartner
{
    /**
     * Attach an authenticated user to an existing tournament team as Player 2
     * using a partner invite token (raw or full /join/{token} URL).
     */
    public function handle(Tournament $tournament, User $partner, string $invite): TournamentTeam
    {
        $token = $this->extractToken($invite);

        return DB::transaction(function () use ($tournament, $partner, $token) {
            $team = TournamentTeam::query()
                ->where('partner_token', $token)
                ->with(['players', 'category.tournament'])
                ->lockForUpdate()
                ->first();

            if ($team === null) {
                throw ValidationException::withMessages([
                    'partner_invite' => __('That invite link is invalid or has already been used.'),
                ]);
            }

            if ($team->category->tournament_id !== $tournament->id) {
                throw ValidationException::withMessages([
                    'partner_invite' => __('That invite link belongs to a different tournament.'),
                ]);
            }

            if ($team->status !== TournamentTeam::STATUS_ACTIVE) {
                throw ValidationException::withMessages([
                    'partner_invite' => __('That team is no longer active.'),
                ]);
            }

            $existingPartner = $team->players->first(fn ($p) => ! $p->is_captain);

            if ($existingPartner !== null && $existingPartner->user_id !== null) {
                throw ValidationException::withMessages([
                    'partner_invite' => __('This invite link has already been used.'),
                ]);
            }

            $alreadyOnTeam = $team->players->contains(
                fn ($p) => $p->user_id === $partner->id,
            );

            if ($alreadyOnTeam) {
                throw ValidationException::withMessages([
                    'partner_invite' => __('You are already on this team.'),
                ]);
            }

            $this->guardSkillLevelRule($tournament, $partner, $team);

            $captain = $team->players->firstWhere('is_captain', true);

            if ($existingPartner !== null) {
                $existingPartner->update([
                    'user_id' => $partner->id,
                    'display_name' => $partner->name,
                ]);
            } else {
                $team->players()->create([
                    'user_id' => $partner->id,
                    'display_name' => $partner->name,
                    'is_captain' => false,
                ]);
            }

            $team->update([
                'display_name' => ($captain?->display_name ?? 'Player 1').' & '.$partner->name,
                'partner_token' => null,
            ]);

            return $team->fresh(['players', 'category.tournament']);
        });
    }

    /**
     * Accept either a raw token or a full invite URL (e.g. "https://…/join/{token}")
     * and return the bare token.
     */
    protected function extractToken(string $invite): string
    {
        $trimmed = trim($invite);

        if ($trimmed === '') {
            throw ValidationException::withMessages([
                'partner_invite' => __('Paste the invite link or token to continue.'),
            ]);
        }

        if (preg_match('~/join/([^/?\#\s]+)~', $trimmed, $matches) === 1) {
            return $matches[1];
        }

        return $trimmed;
    }

    /**
     * Mirror the captain skill-level rule: the joining user must not already be
     * registered in this tournament under a different skill level.
     */
    protected function guardSkillLevelRule(
        Tournament $tournament,
        User $partner,
        TournamentTeam $team,
    ): void {
        $existingTeams = TournamentTeam::query()
            ->where('status', TournamentTeam::STATUS_ACTIVE)
            ->whereHas('category', fn ($q) => $q->where('tournament_id', $tournament->id))
            ->whereHas('players', fn ($q) => $q->where('user_id', $partner->id))
            ->with('category')
            ->get();

        foreach ($existingTeams as $existing) {
            if ($existing->category->skill_level !== $team->category->skill_level) {
                throw ValidationException::withMessages([
                    'partner_invite' => __(
                        'You are already registered in :level categories for this tournament — joining a :target team is not allowed.',
                        [
                            'level' => $existing->category->skill_level->label(),
                            'target' => $team->category->skill_level->label(),
                        ],
                    ),
                ]);
            }
        }
    }
}
