<?php

namespace App\Actions\Scoring;

use App\Models\MatchGame;
use App\Models\Pool;
use App\Models\TournamentTeam;
use Illuminate\Support\Facades\DB;

class GeneratePoolMatches
{
    /**
     * Generate (or regenerate) the round-robin matches inside the given pool.
     * Existing matches for the pool are wiped first so re-running is idempotent
     * after the team roster changes. Matches that have already been played are
     * preserved unless `force` is true.
     */
    public function handle(Pool $pool, bool $force = false): int
    {
        return DB::transaction(function () use ($pool, $force) {
            $teams = $pool->teams()->orderBy('pool_seed')->orderBy('created_at')->get();

            if ($teams->count() < 2) {
                $pool->matches()->whereNull('played_at')->delete();

                return 0;
            }

            if ($force) {
                $pool->matches()->delete();
            } else {
                $pool->matches()->whereNull('played_at')->delete();
            }

            $playedPairs = $pool->matches()
                ->get(['team_a_id', 'team_b_id'])
                ->map(fn (MatchGame $m) => $this->pairKey($m->team_a_id, $m->team_b_id))
                ->all();

            $sequence = ($pool->matches()->max('sequence') ?? 0) + 1;
            $created = 0;

            foreach ($this->roundRobinPairs($teams->all()) as [$teamA, $teamB]) {
                if (in_array($this->pairKey($teamA->id, $teamB->id), $playedPairs, true)) {
                    continue;
                }

                MatchGame::create([
                    'tournament_category_id' => $pool->tournament_category_id,
                    'pool_id' => $pool->id,
                    'stage' => MatchGame::STAGE_POOL,
                    'sequence' => $sequence++,
                    'team_a_id' => $teamA->id,
                    'team_b_id' => $teamB->id,
                ]);

                $created++;
            }

            return $created;
        });
    }

    /**
     * Round-robin pairings using the circle method. Produces n*(n-1)/2 pairs
     * for n teams, ordered so each team is spread across rounds when possible.
     *
     * @param  array<int, TournamentTeam>  $teams
     * @return iterable<int, array{0: TournamentTeam, 1: TournamentTeam}>
     */
    private function roundRobinPairs(array $teams): iterable
    {
        $n = count($teams);
        $hasBye = $n % 2 === 1;

        if ($hasBye) {
            $teams[] = null; // bye
            $n++;
        }

        $half = intdiv($n, 2);
        $rounds = $n - 1;
        $rotation = array_slice($teams, 1); // keep $teams[0] fixed

        for ($round = 0; $round < $rounds; $round++) {
            $left = array_merge([$teams[0]], array_slice($rotation, 0, $half - 1));
            $right = array_reverse(array_slice($rotation, $half - 1, $half));

            for ($i = 0; $i < $half; $i++) {
                $a = $left[$i];
                $b = $right[$i];

                if ($a === null || $b === null) {
                    continue;
                }

                yield [$a, $b];
            }

            // Rotate everyone except $teams[0]
            array_unshift($rotation, array_pop($rotation));
        }
    }

    /**
     * Order-independent pair identifier so (A,B) and (B,A) collapse.
     */
    private function pairKey(?string $a, ?string $b): string
    {
        $ids = array_filter([$a, $b]);
        sort($ids);

        return implode('|', $ids);
    }
}
