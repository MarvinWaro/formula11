<?php

namespace App\Services\Scoring;

use App\Models\MatchGame;
use App\Models\TournamentTeam;
use Illuminate\Support\Collection;

class StandingsCalculator
{
    /**
     * Compute standings for a set of teams from their completed matches.
     *
     * Tie-break order: wins → point_diff → points_for.
     * Partial / unfinished matches are ignored.
     *
     * @param  Collection<int, TournamentTeam>  $teams
     * @param  Collection<int, MatchGame>  $matches
     * @return array<int, array{rank:int, team_id:string, display_name:string, wins:int, losses:int, points_for:int, points_against:int, point_diff:int, played:int}>
     */
    public function handle(Collection $teams, Collection $matches): array
    {
        $stats = [];

        foreach ($teams as $team) {
            $stats[$team->id] = [
                'team_id' => $team->id,
                'display_name' => $team->display_name,
                'wins' => 0,
                'losses' => 0,
                'points_for' => 0,
                'points_against' => 0,
                'point_diff' => 0,
                'played' => 0,
            ];
        }

        foreach ($matches as $match) {
            if (! $match->isComplete()) {
                continue;
            }

            if (! isset($stats[$match->team_a_id]) || ! isset($stats[$match->team_b_id])) {
                continue;
            }

            $stats[$match->team_a_id]['points_for'] += $match->score_a;
            $stats[$match->team_a_id]['points_against'] += $match->score_b;
            $stats[$match->team_a_id]['played']++;

            $stats[$match->team_b_id]['points_for'] += $match->score_b;
            $stats[$match->team_b_id]['points_against'] += $match->score_a;
            $stats[$match->team_b_id]['played']++;

            if ($match->winner_team_id === $match->team_a_id) {
                $stats[$match->team_a_id]['wins']++;
                $stats[$match->team_b_id]['losses']++;
            } else {
                $stats[$match->team_b_id]['wins']++;
                $stats[$match->team_a_id]['losses']++;
            }
        }

        foreach ($stats as &$row) {
            $row['point_diff'] = $row['points_for'] - $row['points_against'];
        }
        unset($row);

        usort($stats, function (array $a, array $b) {
            return [$b['wins'], $b['point_diff'], $b['points_for']]
                <=> [$a['wins'], $a['point_diff'], $a['points_for']];
        });

        foreach ($stats as $index => &$row) {
            $row['rank'] = $index + 1;
        }
        unset($row);

        return array_values($stats);
    }
}
