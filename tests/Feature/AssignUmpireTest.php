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

function umpireAssignSetup(): array
{
    $tournament = Tournament::create(['name' => 'Umpire Cup '.uniqid()]);
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

    return compact('tournament', 'category', 'match');
}

function umpireAdmin(): User
{
    $u = User::factory()->create();
    $u->assignRole(Role::ADMIN);

    return $u;
}

function umpireWithScorePerm(): User
{
    $u = User::factory()->create();
    $u->assignRole(Role::UMPIRE);

    return $u;
}

function umpirePlayer(): User
{
    $u = User::factory()->create();
    $u->assignRole(Role::PLAYER);

    return $u;
}

test('admin can assign an umpire to a match', function () {
    ['tournament' => $t, 'category' => $c, 'match' => $m] = umpireAssignSetup();
    $umpire = umpireWithScorePerm();

    $response = $this->actingAs(umpireAdmin())->patch(
        route('admin.tournaments.scoring.matches.assign-umpire', [
            'tournament' => $t->slug,
            'category' => $c->id,
            'match' => $m->id,
        ]),
        ['assigned_umpire_user_id' => $umpire->id],
    );

    $response->assertRedirect();
    expect($m->fresh()->assigned_umpire_user_id)->toBe($umpire->id);
});

test('assigning a user without scoring.score is rejected', function () {
    ['tournament' => $t, 'category' => $c, 'match' => $m] = umpireAssignSetup();
    $regular = umpirePlayer();

    $response = $this->actingAs(umpireAdmin())->patch(
        route('admin.tournaments.scoring.matches.assign-umpire', [
            'tournament' => $t->slug,
            'category' => $c->id,
            'match' => $m->id,
        ]),
        ['assigned_umpire_user_id' => $regular->id],
    );

    $response->assertSessionHasErrors('assigned_umpire_user_id');
    expect($m->fresh()->assigned_umpire_user_id)->toBeNull();
});

test('passing null clears the assignment', function () {
    ['tournament' => $t, 'category' => $c, 'match' => $m] = umpireAssignSetup();
    $umpire = umpireWithScorePerm();
    $m->update(['assigned_umpire_user_id' => $umpire->id]);

    $this->actingAs(umpireAdmin())->patch(
        route('admin.tournaments.scoring.matches.assign-umpire', [
            'tournament' => $t->slug,
            'category' => $c->id,
            'match' => $m->id,
        ]),
        ['assigned_umpire_user_id' => null],
    )->assertRedirect();

    expect($m->fresh()->assigned_umpire_user_id)->toBeNull();
});

test('a player without scoring.manage cannot assign an umpire', function () {
    ['tournament' => $t, 'category' => $c, 'match' => $m] = umpireAssignSetup();
    $umpire = umpireWithScorePerm();

    $this->actingAs(umpirePlayer())->patch(
        route('admin.tournaments.scoring.matches.assign-umpire', [
            'tournament' => $t->slug,
            'category' => $c->id,
            'match' => $m->id,
        ]),
        ['assigned_umpire_user_id' => $umpire->id],
    )->assertForbidden();
});

test('umpire index splits matches into Yours and Others based on assignment', function () {
    ['match' => $assignedToMe] = umpireAssignSetup();
    ['match' => $assignedToOther] = umpireAssignSetup();
    ['match' => $unassigned] = umpireAssignSetup();

    $me = umpireWithScorePerm();
    $other = umpireWithScorePerm();

    $assignedToMe->update(['assigned_umpire_user_id' => $me->id]);
    $assignedToOther->update(['assigned_umpire_user_id' => $other->id]);

    $response = $this->actingAs($me)->get(route('umpire.index'));

    $response->assertOk();
    $response->assertInertia(fn ($p) => $p
        ->component('umpire/index')
        ->where('currentUserId', $me->id)
        ->has('groups', 3)
    );
});
