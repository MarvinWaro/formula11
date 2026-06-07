<?php

use App\Enums\TournamentStatus;
use App\Models\MatchGame;
use App\Models\Role;
use App\Models\Tournament;
use App\Models\TournamentTeam;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(PermissionSeeder::class);
    $this->seed(RoleSeeder::class);
});

function makeUmpire(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::UMPIRE);

    return $user;
}

function tournamentWithMatch(bool $winByTwo = true, string $stage = MatchGame::STAGE_POOL): array
{
    $tournament = Tournament::create(['name' => 'Cup '.uniqid()]);
    $category = $tournament->categories()->create([
        'name' => 'Cat',
        'division' => 'mens',
        'skill_level' => 'beginner',
        'rr_points_to_win' => 11,
        'elim_points_to_win' => 15,
        'win_by_two' => $winByTwo,
        'bracket_size' => 4,
        'teams_advancing_per_bracket' => 1,
    ]);
    $tournament->update(['status' => TournamentStatus::RegistrationOpen]);

    $teamA = TournamentTeam::create([
        'tournament_category_id' => $category->id,
        'display_name' => 'Alpha',
        'captain_email' => 'a@example.com',
        'status' => TournamentTeam::STATUS_ACTIVE,
    ]);
    $teamB = TournamentTeam::create([
        'tournament_category_id' => $category->id,
        'display_name' => 'Bravo',
        'captain_email' => 'b@example.com',
        'status' => TournamentTeam::STATUS_ACTIVE,
    ]);

    $match = MatchGame::create([
        'tournament_category_id' => $category->id,
        'stage' => $stage,
        'sequence' => 1,
        'team_a_id' => $teamA->id,
        'team_b_id' => $teamB->id,
    ]);

    return compact('tournament', 'category', 'teamA', 'teamB', 'match');
}

test('umpire index lists open matches', function () {
    ['match' => $match] = tournamentWithMatch();
    $umpire = makeUmpire();

    $response = $this->actingAs($umpire)->get(route('umpire.index'));

    $response->assertOk();
    $response->assertInertia(fn ($p) => $p
        ->component('umpire/index')
        ->has('groups', 1)
        ->where('groups.0.matches.0.id', $match->id),
    );
});

test('umpire match scoring screen exposes target and win-by-two flag', function () {
    ['match' => $match, 'category' => $category] = tournamentWithMatch(winByTwo: true);
    $umpire = makeUmpire();

    $response = $this->actingAs($umpire)->get(route('umpire.matches.show', ['match' => $match->id]));

    $response->assertOk();
    $response->assertInertia(fn ($p) => $p
        ->component('umpire/match')
        ->where('category.target_points', $category->rr_points_to_win)
        ->where('category.win_by_two', true)
        ->where('category.rules_label', 'Race to 11 · Win by 2'),
    );
});

test('umpire can patch live scores without finalizing', function () {
    ['match' => $match] = tournamentWithMatch();
    $umpire = makeUmpire();

    $this->actingAs($umpire)->patch(
        route('umpire.matches.score', ['match' => $match->id]),
        ['score_a' => 5, 'score_b' => 3],
    )->assertRedirect();

    $match->refresh();
    expect($match->score_a)->toBe(5);
    expect($match->score_b)->toBe(3);
    expect($match->winner_team_id)->toBeNull();
    expect($match->played_at)->toBeNull();
    expect($match->scored_by_user_id)->toBe($umpire->id);
    expect($match->scored_at)->not->toBeNull();
});

test('finalizing requires reaching the target', function () {
    ['match' => $match] = tournamentWithMatch();
    $umpire = makeUmpire();

    $response = $this->actingAs($umpire)->post(
        route('umpire.matches.finalize', ['match' => $match->id]),
        ['score_a' => 9, 'score_b' => 7],
    );

    $response->assertSessionHasErrors('score_a');
    expect($match->fresh()->played_at)->toBeNull();
});

test('win-by-two rule blocks an 11-10 finalize', function () {
    ['match' => $match] = tournamentWithMatch(winByTwo: true);
    $umpire = makeUmpire();

    $response = $this->actingAs($umpire)->post(
        route('umpire.matches.finalize', ['match' => $match->id]),
        ['score_a' => 11, 'score_b' => 10],
    );

    $response->assertSessionHasErrors('score_a');
    expect($match->fresh()->played_at)->toBeNull();
});

test('win-by-two rule accepts 11-9 finalize', function () {
    ['match' => $match, 'teamA' => $teamA] = tournamentWithMatch(winByTwo: true);
    $umpire = makeUmpire();

    $response = $this->actingAs($umpire)->post(
        route('umpire.matches.finalize', ['match' => $match->id]),
        ['score_a' => 11, 'score_b' => 9],
    );

    $response->assertRedirect(route('umpire.index'));

    $match->refresh();
    expect($match->winner_team_id)->toBe($teamA->id);
    expect($match->played_at)->not->toBeNull();
    expect($match->scored_by_user_id)->toBe($umpire->id);
});

test('without win-by-two, an 11-10 finalize is accepted', function () {
    ['match' => $match, 'teamA' => $teamA] = tournamentWithMatch(winByTwo: false);
    $umpire = makeUmpire();

    $response = $this->actingAs($umpire)->post(
        route('umpire.matches.finalize', ['match' => $match->id]),
        ['score_a' => 11, 'score_b' => 10],
    );

    $response->assertRedirect(route('umpire.index'));
    expect($match->fresh()->winner_team_id)->toBe($teamA->id);
});

test('elimination matches use elim_points_to_win as target', function () {
    ['match' => $match] = tournamentWithMatch(winByTwo: true, stage: MatchGame::STAGE_SEMI);
    $umpire = makeUmpire();

    $under = $this->actingAs($umpire)->post(
        route('umpire.matches.finalize', ['match' => $match->id]),
        ['score_a' => 11, 'score_b' => 9],
    );
    $under->assertSessionHasErrors('score_a');

    $valid = $this->actingAs($umpire)->post(
        route('umpire.matches.finalize', ['match' => $match->id]),
        ['score_a' => 15, 'score_b' => 13],
    );
    $valid->assertRedirect();
    expect($match->fresh()->played_at)->not->toBeNull();
});

test('a finalized match cannot be re-scored by an umpire', function () {
    ['match' => $match, 'teamA' => $teamA] = tournamentWithMatch(winByTwo: true);
    $umpire = makeUmpire();

    $match->update([
        'score_a' => 11,
        'score_b' => 5,
        'winner_team_id' => $teamA->id,
        'played_at' => now(),
    ]);

    $response = $this->actingAs($umpire)->patch(
        route('umpire.matches.score', ['match' => $match->id]),
        ['score_a' => 12, 'score_b' => 5],
    );

    $response->assertSessionHasErrors('score_a');
    expect($match->fresh()->score_a)->toBe(11);
});

test('a player without scoring.score permission cannot access umpire routes', function () {
    ['match' => $match] = tournamentWithMatch();
    $player = User::factory()->create();
    $player->assignRole(Role::PLAYER);

    $this->actingAs($player)
        ->get(route('umpire.index'))
        ->assertForbidden();

    $this->actingAs($player)
        ->patch(
            route('umpire.matches.score', ['match' => $match->id]),
            ['score_a' => 1, 'score_b' => 0],
        )
        ->assertForbidden();
});
