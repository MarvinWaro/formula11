<?php

namespace App\Actions\Scoring;

use App\Models\MatchGame;
use App\Models\TournamentCategory;
use App\Services\Scoring\StandingsCalculator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class GenerateBracketMatches
{
    public function __construct(protected StandingsCalculator $standings) {}

    /**
     * Compute the proposed bracket pairings for a category WITHOUT creating
     * any DB rows. Used to power the preview modal so the admin sees what
     * they're about to commit before pressing Confirm.
     *
     * @return array{semis: array<int, array{slot:string, team_a:string|null, team_b:string|null}>, source: string}
     */
    public function preview(TournamentCategory $category): array
    {
        $this->guardPoolPlayComplete($category);

        $teams = $this->topAdvancingTeams($category);
        $pairings = $this->pairings($teams);

        return [
            'semis' => array_map(fn ($pair, $idx) => [
                'slot' => 'SF'.($idx + 1),
                'team_a' => $pair[0]['display_name'] ?? null,
                'team_b' => $pair[1]['display_name'] ?? null,
            ], $pairings, array_keys($pairings)),
            'source' => $category->pools->count() === 1
                ? 'Top '.count($teams).' from '.$category->pools->first()->name
                : 'Top '.(int) $category->teams_advancing_per_bracket.' from each of '.$category->pools->count().' pools',
        ];
    }

    /**
     * Atomically create SF1, SF2, plus placeholder Bronze and Final matches.
     * Bronze + Final start with team_a/team_b null; they're populated by
     * UpdateMatchScore::finalize() when each semi finalizes.
     */
    public function handle(TournamentCategory $category): TournamentCategory
    {
        $this->guardPoolPlayComplete($category);
        $this->guardNoExistingBracket($category);

        $teams = $this->topAdvancingTeams($category);
        $pairings = $this->pairings($teams);

        return DB::transaction(function () use ($category, $pairings) {
            foreach ($pairings as $index => $pair) {
                MatchGame::create([
                    'tournament_category_id' => $category->id,
                    'stage' => MatchGame::STAGE_SEMI,
                    'sequence' => $index + 1,
                    'team_a_id' => $pair[0]['team_id'] ?? null,
                    'team_b_id' => $pair[1]['team_id'] ?? null,
                ]);
            }

            MatchGame::create([
                'tournament_category_id' => $category->id,
                'stage' => MatchGame::STAGE_BRONZE,
                'sequence' => 1,
                'team_a_id' => null,
                'team_b_id' => null,
            ]);

            MatchGame::create([
                'tournament_category_id' => $category->id,
                'stage' => MatchGame::STAGE_FINAL,
                'sequence' => 1,
                'team_a_id' => null,
                'team_b_id' => null,
            ]);

            return $category->fresh('matches');
        });
    }

    /**
     * Wipe an existing bracket so the admin can regenerate. Refuses if any
     * bracket match has already been finalized — too late to undo cleanly.
     */
    public function reset(TournamentCategory $category): void
    {
        $bracketMatches = $category->matches()
            ->whereIn('stage', [MatchGame::STAGE_SEMI, MatchGame::STAGE_BRONZE, MatchGame::STAGE_FINAL])
            ->get();

        if ($bracketMatches->isEmpty()) {
            return;
        }

        foreach ($bracketMatches as $match) {
            if ($match->isFinalized()) {
                throw ValidationException::withMessages([
                    'bracket' => __('One or more bracket matches have already been finalized — reset their scores first.'),
                ]);
            }
        }

        DB::transaction(function () use ($bracketMatches) {
            foreach ($bracketMatches as $match) {
                $match->delete();
            }
        });
    }

    protected function guardPoolPlayComplete(TournamentCategory $category): void
    {
        $category->load('pools.matches');

        $totalPoolMatches = 0;
        $finalizedPoolMatches = 0;

        foreach ($category->pools as $pool) {
            foreach ($pool->matches as $match) {
                $totalPoolMatches++;
                if ($match->played_at !== null) {
                    $finalizedPoolMatches++;
                }
            }
        }

        if ($totalPoolMatches === 0) {
            throw ValidationException::withMessages([
                'bracket' => __('No pool matches exist yet for this category.'),
            ]);
        }

        if ($finalizedPoolMatches < $totalPoolMatches) {
            $remaining = $totalPoolMatches - $finalizedPoolMatches;
            throw ValidationException::withMessages([
                'bracket' => __(':remaining pool match(es) still need to be finalized.', ['remaining' => $remaining]),
            ]);
        }
    }

    protected function guardNoExistingBracket(TournamentCategory $category): void
    {
        $existing = $category->matches()
            ->whereIn('stage', [MatchGame::STAGE_SEMI, MatchGame::STAGE_BRONZE, MatchGame::STAGE_FINAL])
            ->exists();

        if ($existing) {
            throw ValidationException::withMessages([
                'bracket' => __('The playoff bracket has already been generated. Reset it first if you need to regenerate.'),
            ]);
        }
    }

    /**
     * Pick the teams that advance. Single-pool tournaments take the top
     * `bracket_size` from that pool; multi-pool tournaments take the top
     * `teams_advancing_per_bracket` from each pool.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function topAdvancingTeams(TournamentCategory $category): array
    {
        $category->load(['pools.teams', 'pools.matches']);

        $pools = $category->pools;
        $bracketSize = (int) $category->bracket_size;

        if ($pools->count() === 1) {
            $standings = $this->standings->handle(
                $pools->first()->teams,
                $pools->first()->matches,
            );

            return array_slice($standings, 0, $bracketSize);
        }

        $advancingPerPool = (int) $category->teams_advancing_per_bracket;
        $survivors = [];

        foreach ($pools as $pool) {
            $poolStandings = $this->standings->handle($pool->teams, $pool->matches);
            $topFromPool = array_slice($poolStandings, 0, $advancingPerPool);
            foreach ($topFromPool as $idx => $row) {
                $row['pool_rank'] = $idx + 1;
                $row['pool_name'] = $pool->name;
                $survivors[] = $row;
            }
        }

        usort($survivors, fn ($a, $b) => $a['pool_rank'] <=> $b['pool_rank']);

        return array_slice($survivors, 0, $bracketSize);
    }

    /**
     * Standard 4-team bracket pairings: 1v4 (SF1), 2v3 (SF2). Pads with
     * "TBD" team rows if fewer than 4 teams advance.
     *
     * @param  array<int, array<string, mixed>>  $teams
     * @return array<int, array<int, array<string, mixed>>>
     */
    protected function pairings(array $teams): array
    {
        if (count($teams) < 2) {
            throw ValidationException::withMessages([
                'bracket' => __('Not enough teams to build a bracket — at least 2 are required.'),
            ]);
        }

        $padded = array_pad($teams, 4, ['team_id' => null, 'display_name' => 'TBD']);

        return [
            [$padded[0], $padded[3]],
            [$padded[1], $padded[2]],
        ];
    }
}
