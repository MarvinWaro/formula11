<?php

use App\Actions\Scoring\UpdateMatchScore;
use App\Enums\TournamentStatus;
use App\Models\MatchGame;
use App\Models\Pool;
use App\Models\Role;
use App\Models\Tournament;
use App\Models\TournamentCategory;
use App\Models\TournamentTeam;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(PermissionSeeder::class);
    $this->seed(RoleSeeder::class);
});

/**
 * Stand up a single-pool category with N teams + a full round-robin of
 * finalized matches, ranked deterministically (team #1 wins all, #2 wins
 * all but vs #1, etc.).
 *
 * @return array{tournament: Tournament, category: TournamentCategory, teams: array<int, TournamentTeam>}
 */
function playoffsSetup(int $teamCount = 4, bool $finalizeAll = true): array
{
    $tournament = Tournament::create(['name' => 'Playoffs Cup '.uniqid()]);
    $category = $tournament->categories()->create([
        'name' => 'Beginner Mens',
        'division' => 'mens',
        'skill_level' => 'beginner',
        'rr_points_to_win' => 11,
        'elim_points_to_win' => 15,
        'win_by_two' => true,
        'bracket_size' => 4,
        'teams_advancing_per_bracket' => 1,
    ]);
    $tournament->update(['status' => TournamentStatus::RegistrationOpen]);

    $pool = Pool::create([
        'tournament_category_id' => $category->id,
        'name' => 'Pool A',
        'display_order' => 1,
    ]);

    $teams = [];
    for ($i = 1; $i <= $teamCount; $i++) {
        $teams[] = TournamentTeam::create([
            'tournament_category_id' => $category->id,
            'pool_id' => $pool->id,
            'display_name' => "Team {$i}",
            'captain_email' => "t{$i}@example.com",
            'status' => TournamentTeam::STATUS_ACTIVE,
        ]);
    }

    $sequence = 1;
    for ($i = 0; $i < $teamCount; $i++) {
        for ($j = $i + 1; $j < $teamCount; $j++) {
            // Lower-indexed team wins to give deterministic standings.
            MatchGame::create([
                'tournament_category_id' => $category->id,
                'pool_id' => $pool->id,
                'stage' => MatchGame::STAGE_POOL,
                'sequence' => $sequence++,
                'team_a_id' => $teams[$i]->id,
                'team_b_id' => $teams[$j]->id,
                'score_a' => 11,
                'score_b' => 11 - ($j - $i),
                'winner_team_id' => $finalizeAll ? $teams[$i]->id : null,
                'played_at' => $finalizeAll ? now() : null,
            ]);
        }
    }

    return compact('tournament', 'category', 'teams');
}

function playoffsAdmin(): User
{
    $u = User::factory()->create();
    $u->assignRole(Role::ADMIN);

    return $u;
}

function playoffsPlayer(): User
{
    $u = User::factory()->create();
    $u->assignRole(Role::PLAYER);

    return $u;
}

test('admin can generate a 4-team single-pool playoff bracket', function () {
    ['tournament' => $t, 'category' => $c, 'teams' => $teams] = playoffsSetup();

    $response = $this->actingAs(playoffsAdmin())->post(
        route('admin.tournaments.scoring.playoffs.store', [
            'tournament' => $t->slug,
            'category' => $c->id,
        ]),
    );

    $response->assertRedirect();

    $bracket = MatchGame::query()
        ->where('tournament_category_id', $c->id)
        ->whereIn('stage', [MatchGame::STAGE_SEMI, MatchGame::STAGE_BRONZE, MatchGame::STAGE_FINAL])
        ->orderBy('stage')
        ->orderBy('sequence')
        ->get();

    expect($bracket)->toHaveCount(4);

    $semis = $bracket->where('stage', MatchGame::STAGE_SEMI)->values();
    expect($semis)->toHaveCount(2);
    // SF1 = rank 1 (Team 1) vs rank 4 (Team 4)
    expect($semis[0]->team_a_id)->toBe($teams[0]->id);
    expect($semis[0]->team_b_id)->toBe($teams[3]->id);
    // SF2 = rank 2 (Team 2) vs rank 3 (Team 3)
    expect($semis[1]->team_a_id)->toBe($teams[1]->id);
    expect($semis[1]->team_b_id)->toBe($teams[2]->id);

    $bronze = $bracket->firstWhere('stage', MatchGame::STAGE_BRONZE);
    $final = $bracket->firstWhere('stage', MatchGame::STAGE_FINAL);
    expect($bronze->team_a_id)->toBeNull();
    expect($bronze->team_b_id)->toBeNull();
    expect($final->team_a_id)->toBeNull();
    expect($final->team_b_id)->toBeNull();
});

test('generating is blocked while pool play is in progress', function () {
    ['tournament' => $t, 'category' => $c] = playoffsSetup(teamCount: 4, finalizeAll: false);

    $response = $this->actingAs(playoffsAdmin())->post(
        route('admin.tournaments.scoring.playoffs.store', [
            'tournament' => $t->slug,
            'category' => $c->id,
        ]),
    );

    $response->assertSessionHasErrors('bracket');
    expect(MatchGame::where('tournament_category_id', $c->id)->where('stage', MatchGame::STAGE_SEMI)->count())->toBe(0);
});

test('generating twice without resetting is blocked', function () {
    ['tournament' => $t, 'category' => $c] = playoffsSetup();

    $this->actingAs(playoffsAdmin())->post(
        route('admin.tournaments.scoring.playoffs.store', [
            'tournament' => $t->slug,
            'category' => $c->id,
        ]),
    )->assertRedirect();

    $response = $this->actingAs(playoffsAdmin())->post(
        route('admin.tournaments.scoring.playoffs.store', [
            'tournament' => $t->slug,
            'category' => $c->id,
        ]),
    );

    $response->assertSessionHasErrors('bracket');
});

test('admin can reset an unfinalized bracket and regenerate', function () {
    ['tournament' => $t, 'category' => $c] = playoffsSetup();

    $this->actingAs(playoffsAdmin())->post(route('admin.tournaments.scoring.playoffs.store', [
        'tournament' => $t->slug, 'category' => $c->id,
    ]))->assertRedirect();

    $this->actingAs(playoffsAdmin())->delete(route('admin.tournaments.scoring.playoffs.destroy', [
        'tournament' => $t->slug, 'category' => $c->id,
    ]))->assertRedirect();

    expect(MatchGame::where('tournament_category_id', $c->id)->where('stage', MatchGame::STAGE_SEMI)->count())->toBe(0);

    $this->actingAs(playoffsAdmin())->post(route('admin.tournaments.scoring.playoffs.store', [
        'tournament' => $t->slug, 'category' => $c->id,
    ]))->assertRedirect();

    expect(MatchGame::where('tournament_category_id', $c->id)->where('stage', MatchGame::STAGE_SEMI)->count())->toBe(2);
});

test('reset is blocked if any bracket match has been finalized', function () {
    ['tournament' => $t, 'category' => $c] = playoffsSetup();

    $this->actingAs(playoffsAdmin())->post(route('admin.tournaments.scoring.playoffs.store', [
        'tournament' => $t->slug, 'category' => $c->id,
    ]));

    $semi = MatchGame::where('tournament_category_id', $c->id)
        ->where('stage', MatchGame::STAGE_SEMI)
        ->first();
    $semi->update([
        'score_a' => 15,
        'score_b' => 10,
        'winner_team_id' => $semi->team_a_id,
        'played_at' => now(),
    ]);

    $response = $this->actingAs(playoffsAdmin())->delete(route('admin.tournaments.scoring.playoffs.destroy', [
        'tournament' => $t->slug, 'category' => $c->id,
    ]));

    $response->assertSessionHasErrors('bracket');
});

test('finalizing a semifinal populates final and bronze slots', function () {
    ['tournament' => $t, 'category' => $c, 'teams' => $teams] = playoffsSetup();
    $umpire = playoffsAdmin();

    $this->actingAs($umpire)->post(route('admin.tournaments.scoring.playoffs.store', [
        'tournament' => $t->slug, 'category' => $c->id,
    ]));

    $semis = MatchGame::where('tournament_category_id', $c->id)
        ->where('stage', MatchGame::STAGE_SEMI)
        ->orderBy('sequence')
        ->get();

    // SF1: Team 1 beats Team 4.
    app(UpdateMatchScore::class)->finalize($semis[0], 15, 7, $umpire);
    // SF2: Team 2 beats Team 3.
    app(UpdateMatchScore::class)->finalize($semis[1], 15, 9, $umpire);

    $final = MatchGame::where('tournament_category_id', $c->id)
        ->where('stage', MatchGame::STAGE_FINAL)
        ->first();
    $bronze = MatchGame::where('tournament_category_id', $c->id)
        ->where('stage', MatchGame::STAGE_BRONZE)
        ->first();

    expect($final->team_a_id)->toBe($teams[0]->id); // SF1 winner → Final.team_a
    expect($final->team_b_id)->toBe($teams[1]->id); // SF2 winner → Final.team_b
    expect($bronze->team_a_id)->toBe($teams[3]->id); // SF1 loser  → Bronze.team_a
    expect($bronze->team_b_id)->toBe($teams[2]->id); // SF2 loser  → Bronze.team_b
});

test('a player without scoring.manage cannot generate or reset', function () {
    ['tournament' => $t, 'category' => $c] = playoffsSetup();
    $player = playoffsPlayer();

    $this->actingAs($player)->post(route('admin.tournaments.scoring.playoffs.store', [
        'tournament' => $t->slug, 'category' => $c->id,
    ]))->assertForbidden();

    $this->actingAs($player)->delete(route('admin.tournaments.scoring.playoffs.destroy', [
        'tournament' => $t->slug, 'category' => $c->id,
    ]))->assertForbidden();
});

test('preview returns proposed pairings without persisting anything', function () {
    ['tournament' => $t, 'category' => $c, 'teams' => $teams] = playoffsSetup();

    $response = $this->actingAs(playoffsAdmin())->getJson(
        route('admin.tournaments.scoring.playoffs.preview', [
            'tournament' => $t->slug,
            'category' => $c->id,
        ]),
    );

    $response->assertOk();
    $response->assertJsonPath('semis.0.slot', 'SF1');
    $response->assertJsonPath('semis.0.team_a', $teams[0]->display_name);
    $response->assertJsonPath('semis.0.team_b', $teams[3]->display_name);
    $response->assertJsonPath('semis.1.team_a', $teams[1]->display_name);
    $response->assertJsonPath('semis.1.team_b', $teams[2]->display_name);

    expect(MatchGame::where('tournament_category_id', $c->id)->where('stage', MatchGame::STAGE_SEMI)->count())->toBe(0);
});
