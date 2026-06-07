<?php

use App\Enums\TournamentStatus;
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

function makeVisibilityPlayer(string $email = 'visibility@test.local'): User
{
    $user = User::factory()->create(['email' => $email]);
    $user->assignRole(Role::PLAYER);

    return $user;
}

function tournamentWithStatus(TournamentStatus $status): Tournament
{
    $tournament = Tournament::create([
        'name' => 'Visibility Cup '.uniqid(),
        'registration_deadline' => now()->addDays(3),
    ]);
    $tournament->categories()->create([
        'name' => 'Beginner Mens',
        'division' => 'mens',
        'skill_level' => 'beginner',
        'rr_points_to_win' => 11,
        'elim_points_to_win' => 15,
        'bracket_size' => 4,
        'teams_advancing_per_bracket' => 1,
    ]);
    $tournament->update(['status' => $status]);

    return $tournament->fresh('categories');
}

function registerTeam(Tournament $tournament, User $captain): TournamentTeam
{
    $category = $tournament->categories->first();

    return tap(TournamentTeam::create([
        'tournament_category_id' => $category->id,
        'display_name' => $captain->name.' & Partner',
        'captain_email' => $captain->email,
        'status' => TournamentTeam::STATUS_ACTIVE,
    ]), fn ($team) => $team->players()->create([
        'user_id' => $captain->id,
        'display_name' => $captain->name,
        'is_captain' => true,
    ]));
}

test('index lists tournaments still open for registration', function () {
    $tournament = tournamentWithStatus(TournamentStatus::RegistrationOpen);
    $player = makeVisibilityPlayer();

    $response = $this->actingAs($player)->get(route('player.tournaments.index'));

    $response->assertOk();
    $response->assertInertia(fn ($p) => $p
        ->has('tournaments', 1)
        ->where('tournaments.0.slug', $tournament->slug),
    );
});

test('index also lists in-progress tournaments where the player has a team', function () {
    $openTournament = tournamentWithStatus(TournamentStatus::RegistrationOpen);
    $inProgressTournament = tournamentWithStatus(TournamentStatus::InProgress);
    $player = makeVisibilityPlayer();

    registerTeam($inProgressTournament, $player);

    $response = $this->actingAs($player)->get(route('player.tournaments.index'));

    $response->assertOk();
    $response->assertInertia(fn ($p) => $p->has('tournaments', 2));
});

test('index hides in-progress tournaments where the player has no team', function () {
    tournamentWithStatus(TournamentStatus::InProgress);
    $player = makeVisibilityPlayer();

    $response = $this->actingAs($player)->get(route('player.tournaments.index'));

    $response->assertOk();
    $response->assertInertia(fn ($p) => $p->has('tournaments', 0));
});

test('show is reachable for in-progress tournament when player has a team', function () {
    $tournament = tournamentWithStatus(TournamentStatus::InProgress);
    $player = makeVisibilityPlayer();
    registerTeam($tournament, $player);

    $response = $this->actingAs($player)->get(
        route('player.tournaments.show', ['tournament' => $tournament->slug]),
    );

    $response->assertOk();
    $response->assertInertia(fn ($p) => $p
        ->component('player/tournaments/show')
        ->where('tournament.registration_open', false)
        ->where('tournament.status', 'in_progress')
        ->has('existingTeams', 1),
    );
});

test('show 404s for an in-progress tournament when the player has no team', function () {
    $tournament = tournamentWithStatus(TournamentStatus::InProgress);
    $player = makeVisibilityPlayer();

    $this->actingAs($player)->get(
        route('player.tournaments.show', ['tournament' => $tournament->slug]),
    )->assertNotFound();
});

test('show remains 200 for an open tournament with no existing team', function () {
    $tournament = tournamentWithStatus(TournamentStatus::RegistrationOpen);
    $player = makeVisibilityPlayer();

    $response = $this->actingAs($player)->get(
        route('player.tournaments.show', ['tournament' => $tournament->slug]),
    );

    $response->assertOk();
    $response->assertInertia(fn ($p) => $p
        ->where('tournament.registration_open', true)
        ->has('existingTeams', 0),
    );
});

test('a stranger player cannot accept invite once registration closes', function () {
    $tournament = tournamentWithStatus(TournamentStatus::InProgress);
    $player = makeVisibilityPlayer();

    $this->actingAs($player)->post(
        route('player.tournaments.accept-invite', ['tournament' => $tournament->slug]),
        ['partner_invite' => 'whatever'],
    )->assertNotFound();
});
