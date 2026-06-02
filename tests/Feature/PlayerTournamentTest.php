<?php

use App\Enums\TournamentStatus;
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

function browsePlayer(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::PLAYER);

    return $user;
}

function browseAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::ADMIN);

    return $user;
}

function browseTournament(string $name, TournamentStatus $status = TournamentStatus::RegistrationOpen): Tournament
{
    return Tournament::create([
        'name' => $name,
        'venue' => "{$name} Court",
        'organizer_name' => "{$name} Organizer",
        'starts_at' => now()->addWeek()->toDateString(),
        'ends_at' => now()->addWeek()->addDay()->toDateString(),
        'status' => $status,
    ]);
}

function browseCategory(Tournament $tournament, ?int $maxTeams = null): TournamentCategory
{
    return $tournament->categories()->create([
        'name' => "Beginner's Men",
        'division' => 'mens',
        'skill_level' => 'beginner',
        'format' => 'round_robin_elimination',
        'rr_points_to_win' => 11,
        'elim_points_to_win' => 15,
        'bracket_size' => 4,
        'teams_advancing_per_bracket' => 1,
        'max_teams' => $maxTeams,
        'registration_fee' => 500,
    ]);
}

test('players see only tournaments open for registration', function () {
    $open = browseTournament('Open Cup');
    browseCategory($open);

    $draft = browseTournament('Draft Cup', TournamentStatus::Draft);
    browseCategory($draft);

    $response = $this
        ->actingAs(browsePlayer())
        ->get(route('player.tournaments.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('player/tournaments/index')
        ->where('tournaments', fn ($tournaments) => collect($tournaments)
            ->pluck('name')
            ->contains('Open Cup')
            && ! collect($tournaments)->pluck('name')->contains('Draft Cup')),
    );
});

test('players can register for an open tournament from the player page', function () {
    $tournament = browseTournament('Register Cup');
    $category = browseCategory($tournament);
    $player = browsePlayer();

    $response = $this
        ->actingAs($player)
        ->post(route('player.tournaments.store', $tournament), [
            'category_id' => $category->id,
            'registration_mode' => 'pair',
            'partner_name' => 'Partner Player',
            'captain_phone' => '09171234567',
        ]);

    $team = TournamentTeam::first();

    expect($team)->not->toBeNull();
    expect($team->display_name)->toBe($player->name.' & Partner Player');
    expect($team->players()->where('user_id', $player->id)->where('is_captain', true)->exists())->toBeTrue();

    $response->assertRedirect(route('public.register.success', [
        'code' => $tournament->registration_code,
        'team' => $team->id,
    ]));
});

test('player tournament registration requires a partner name', function () {
    $tournament = browseTournament('Partner Required Cup');
    $category = browseCategory($tournament);

    $response = $this
        ->actingAs(browsePlayer())
        ->post(route('player.tournaments.store', $tournament), [
            'category_id' => $category->id,
            'registration_mode' => 'pair',
        ]);

    $response->assertSessionHasErrors('partner_name');
    expect(TournamentTeam::count())->toBe(0);
});

test('players cannot register into a full category', function () {
    $tournament = browseTournament('Full Cup');
    $category = browseCategory($tournament, maxTeams: 1);

    $category->teams()->create([
        'display_name' => 'Existing Team',
        'captain_email' => 'existing@example.com',
        'status' => TournamentTeam::STATUS_ACTIVE,
    ]);

    $response = $this
        ->actingAs(browsePlayer())
        ->post(route('player.tournaments.store', $tournament), [
            'category_id' => $category->id,
            'registration_mode' => 'pair',
            'partner_name' => 'Too Late',
        ]);

    $response->assertSessionHasErrors('category_id');
    expect(TournamentTeam::count())->toBe(1);
});

test('players cannot access admin tournament management', function () {
    $response = $this
        ->actingAs(browsePlayer())
        ->get(route('admin.tournaments.index'));

    $response->assertForbidden();
});

test('admins do not access player tournament browsing', function () {
    $response = $this
        ->actingAs(browseAdmin())
        ->get(route('player.tournaments.index'));

    $response->assertForbidden();
});
