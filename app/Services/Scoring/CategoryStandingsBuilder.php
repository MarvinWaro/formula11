<?php

namespace App\Services\Scoring;

use App\Models\MatchGame;
use App\Models\Pool;
use App\Models\TournamentCategory;
use App\Models\TournamentTeam;
use Illuminate\Support\Collection;

class CategoryStandingsBuilder
{
    public function __construct(protected StandingsCalculator $standings) {}

    /**
     * Build the full pools + bracket payload for a category. Caller is
     * expected to eager-load `pools.teams`, `pools.matches.teamA`,
     * `pools.matches.teamB`, `matches.teamA`, `matches.teamB` upfront.
     *
     * @return array{pools: array<int, array<string, mixed>>, bracket: array<string, mixed>|null}
     */
    public function build(TournamentCategory $category): array
    {
        return [
            'pools' => $category->pools->map(fn (Pool $pool) => $this->pool($pool))->values()->all(),
            'bracket' => $this->bracket($category->matches),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function pool(Pool $pool): array
    {
        $teams = $pool->teams;
        $matches = $pool->matches;

        return [
            'id' => $pool->id,
            'name' => $pool->name,
            'teams' => $teams->map(fn (TournamentTeam $t) => [
                'id' => $t->id,
                'display_name' => $t->display_name,
                'pool_seed' => $t->pool_seed,
            ])->values(),
            'matches' => $matches->map(fn (MatchGame $m) => $this->match($m))->values(),
            'standings' => $this->standings->handle($teams, $matches),
        ];
    }

    /**
     * Group non-pool matches (semi / bronze / final) into a flat bracket
     * payload, or null when nothing has been seeded yet.
     *
     * @param  Collection<int, MatchGame>  $matches
     * @return array{semis: array<int, mixed>, bronze: mixed, final: mixed}|null
     */
    public function bracket(Collection $matches): ?array
    {
        $bracketMatches = $matches->filter(fn (MatchGame $m) => $m->stage !== MatchGame::STAGE_POOL);

        if ($bracketMatches->isEmpty()) {
            return null;
        }

        $semis = $bracketMatches
            ->where('stage', MatchGame::STAGE_SEMI)
            ->sortBy('sequence')
            ->map(fn (MatchGame $m) => $this->match($m))
            ->values()
            ->all();

        $bronze = $bracketMatches->firstWhere('stage', MatchGame::STAGE_BRONZE);
        $final = $bracketMatches->firstWhere('stage', MatchGame::STAGE_FINAL);

        return [
            'semis' => $semis,
            'bronze' => $bronze ? $this->match($bronze) : null,
            'final' => $final ? $this->match($final) : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function match(MatchGame $match): array
    {
        return [
            'id' => $match->id,
            'sequence' => $match->sequence,
            'court_number' => $match->court_number,
            'assigned_umpire' => $match->assignedUmpire ? [
                'id' => $match->assignedUmpire->id,
                'name' => $match->assignedUmpire->name,
            ] : null,
            'stage' => $match->stage,
            'team_a' => $match->teamA ? [
                'id' => $match->teamA->id,
                'display_name' => $match->teamA->display_name,
            ] : null,
            'team_b' => $match->teamB ? [
                'id' => $match->teamB->id,
                'display_name' => $match->teamB->display_name,
            ] : null,
            'score_a' => $match->score_a,
            'score_b' => $match->score_b,
            'winner_team_id' => $match->winner_team_id,
            'played_at' => $match->played_at?->toIso8601String(),
        ];
    }
}
