<?php

use App\Enums\TournamentStatus;
use App\Models\MatchGame;
use App\Models\Pool;
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

function courtTournamentWithMatch(): array
{
    $tournament = Tournament::create(['name' => 'Court Cup '.uniqid()]);
    $category = $tournament->categories()->create([
        'name' => 'Beginner Mens',
        'division' => 'mens',
        'skill_level' => 'beginner',
        'rr_points_to_win' => 11,
        'elim_points_to_win' => 15,
        'bracket_size' => 4,
        'teams_advancing_per_bracket' => 1,
    ]);
    $tournament->update(['status' => TournamentStatus::RegistrationOpen]);

    $pool = Pool::create([
        'tournament_category_id' => $category->id,
        'name' => 'Pool A',
        'display_order' => 1,
    ]);

    $teamA = TournamentTeam::create([
        'tournament_category_id' => $category->id,
        'pool_id' => $pool->id,
        'display_name' => 'Alpha',
        'captain_email' => 'a@example.com',
        'status' => TournamentTeam::STATUS_ACTIVE,
    ]);
    $teamB = TournamentTeam::create([
        'tournament_category_id' => $category->id,
        'pool_id' => $pool->id,
        'display_name' => 'Bravo',
        'captain_email' => 'b@example.com',
        'status' => TournamentTeam::STATUS_ACTIVE,
    ]);

    $match = MatchGame::create([
        'tournament_category_id' => $category->id,
        'pool_id' => $pool->id,
        'stage' => MatchGame::STAGE_POOL,
        'sequence' => 1,
        'team_a_id' => $teamA->id,
        'team_b_id' => $teamB->id,
    ]);

    return compact('tournament', 'category', 'pool', 'match', 'teamA', 'teamB');
}

function courtAdminUser(): User
{
    $u = User::factory()->create();
    $u->assignRole(Role::ADMIN);

    return $u;
}

function courtOwnerForAssign(): User
{
    $u = User::factory()->create();
    $u->assignRole(Role::COURT_OWNER);

    return $u;
}

function playerForCourt(): User
{
    $u = User::factory()->create();
    $u->assignRole(Role::PLAYER);

    return $u;
}

test('admin can assign a court number to a match', function () {
    ['tournament' => $t, 'category' => $c, 'match' => $m] = courtTournamentWithMatch();

    $response = $this->actingAs(courtAdminUser())->patch(
        route('admin.tournaments.scoring.matches.assign', [
            'tournament' => $t->slug,
            'category' => $c->id,
            'match' => $m->id,
        ]),
        ['court_number' => '2'],
    );

    $response->assertRedirect();
    expect($m->fresh()->court_number)->toBe('2');
});

test('court owner can also assign a court', function () {
    ['tournament' => $t, 'category' => $c, 'match' => $m] = courtTournamentWithMatch();

    $this->actingAs(courtOwnerForAssign())->patch(
        route('admin.tournaments.scoring.matches.assign', [
            'tournament' => $t->slug,
            'category' => $c->id,
            'match' => $m->id,
        ]),
        ['court_number' => 'Center'],
    )->assertRedirect();

    expect($m->fresh()->court_number)->toBe('Center');
});

test('a player without scoring.manage cannot assign a court', function () {
    ['tournament' => $t, 'category' => $c, 'match' => $m] = courtTournamentWithMatch();

    $this->actingAs(playerForCourt())->patch(
        route('admin.tournaments.scoring.matches.assign', [
            'tournament' => $t->slug,
            'category' => $c->id,
            'match' => $m->id,
        ]),
        ['court_number' => '1'],
    )->assertForbidden();

    expect($m->fresh()->court_number)->toBeNull();
});

test('passing null clears the court number', function () {
    ['tournament' => $t, 'category' => $c, 'match' => $m] = courtTournamentWithMatch();
    $m->update(['court_number' => '3']);

    $this->actingAs(courtAdminUser())->patch(
        route('admin.tournaments.scoring.matches.assign', [
            'tournament' => $t->slug,
            'category' => $c->id,
            'match' => $m->id,
        ]),
        ['court_number' => null],
    )->assertRedirect();

    expect($m->fresh()->court_number)->toBeNull();
});

test('court_number over 16 characters is rejected', function () {
    ['tournament' => $t, 'category' => $c, 'match' => $m] = courtTournamentWithMatch();

    $response = $this->actingAs(courtAdminUser())->patch(
        route('admin.tournaments.scoring.matches.assign', [
            'tournament' => $t->slug,
            'category' => $c->id,
            'match' => $m->id,
        ]),
        ['court_number' => str_repeat('A', 17)],
    );

    $response->assertSessionHasErrors('court_number');
    expect($m->fresh()->court_number)->toBeNull();
});

test('assigning a court does not finalize the match', function () {
    ['tournament' => $t, 'category' => $c, 'match' => $m] = courtTournamentWithMatch();

    $this->actingAs(courtAdminUser())->patch(
        route('admin.tournaments.scoring.matches.assign', [
            'tournament' => $t->slug,
            'category' => $c->id,
            'match' => $m->id,
        ]),
        ['court_number' => '1'],
    )->assertRedirect();

    $m->refresh();
    expect($m->court_number)->toBe('1');
    expect($m->score_a)->toBeNull();
    expect($m->score_b)->toBeNull();
    expect($m->winner_team_id)->toBeNull();
    expect($m->played_at)->toBeNull();
});

test('mismatched tournament + category returns 404', function () {
    ['tournament' => $t, 'category' => $c, 'match' => $m] = courtTournamentWithMatch();
    ['category' => $otherCategory] = courtTournamentWithMatch();

    $this->actingAs(courtAdminUser())->patch(
        route('admin.tournaments.scoring.matches.assign', [
            'tournament' => $t->slug,
            'category' => $otherCategory->id,
            'match' => $m->id,
        ]),
        ['court_number' => '1'],
    )->assertNotFound();
});
