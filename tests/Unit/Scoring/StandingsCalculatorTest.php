<?php

use App\Models\MatchGame;
use App\Models\TournamentTeam;
use App\Services\Scoring\StandingsCalculator;
use Illuminate\Support\Collection;

function makeStandingsTeam(string $id, string $name): TournamentTeam
{
    $team = new TournamentTeam;
    $team->forceFill(['id' => $id, 'display_name' => $name]);

    return $team;
}

function makeStandingsMatch(string $a, string $b, ?int $scoreA, ?int $scoreB, ?string $winner = null): MatchGame
{
    $match = new MatchGame;
    $match->forceFill([
        'team_a_id' => $a,
        'team_b_id' => $b,
        'score_a' => $scoreA,
        'score_b' => $scoreB,
        'winner_team_id' => $winner,
    ]);

    return $match;
}

test('ranks teams by wins, then point differential, then points for', function () {
    $teams = new Collection([
        makeStandingsTeam('t1', 'Alpha'),
        makeStandingsTeam('t2', 'Bravo'),
        makeStandingsTeam('t3', 'Charlie'),
    ]);

    $matches = new Collection([
        makeStandingsMatch('t1', 't2', 11, 5, 't1'),
        makeStandingsMatch('t1', 't3', 11, 9, 't1'),
        makeStandingsMatch('t2', 't3', 11, 4, 't2'),
    ]);

    $result = (new StandingsCalculator)->handle($teams, $matches);

    expect($result)->toHaveCount(3);
    expect($result[0]['team_id'])->toBe('t1');
    expect($result[0]['wins'])->toBe(2);
    expect($result[0]['rank'])->toBe(1);

    expect($result[1]['team_id'])->toBe('t2');
    expect($result[1]['wins'])->toBe(1);
    // Bravo: 5 PF vs Alpha (loss) + 11 PF vs Charlie (win) = 16 PF;
    // gave up 11 + 4 = 15 PA; PD = +1.
    expect($result[1]['point_diff'])->toBe(1);
});

test('ignores incomplete matches', function () {
    $teams = new Collection([
        makeStandingsTeam('t1', 'Alpha'),
        makeStandingsTeam('t2', 'Bravo'),
    ]);

    $matches = new Collection([
        makeStandingsMatch('t1', 't2', 5, null, null),
    ]);

    $result = (new StandingsCalculator)->handle($teams, $matches);

    expect($result[0]['played'])->toBe(0);
    expect($result[0]['wins'])->toBe(0);
});

test('handles empty inputs', function () {
    $result = (new StandingsCalculator)->handle(new Collection, new Collection);

    expect($result)->toBe([]);
});

test('breaks ties by point differential when wins are equal', function () {
    $teams = new Collection([
        makeStandingsTeam('t1', 'Alpha'),
        makeStandingsTeam('t2', 'Bravo'),
        makeStandingsTeam('t3', 'Charlie'),
        makeStandingsTeam('t4', 'Delta'),
    ]);

    // t1 and t2 both win 2; t1 has bigger PD.
    $matches = new Collection([
        makeStandingsMatch('t1', 't3', 11, 1, 't1'),
        makeStandingsMatch('t1', 't4', 11, 2, 't1'),
        makeStandingsMatch('t2', 't3', 11, 7, 't2'),
        makeStandingsMatch('t2', 't4', 11, 8, 't2'),
    ]);

    $result = (new StandingsCalculator)->handle($teams, $matches);

    expect($result[0]['team_id'])->toBe('t1');
    expect($result[1]['team_id'])->toBe('t2');
});
