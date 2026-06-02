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

function openTournamentForInvite(string $skillLevel = 'beginner', string $division = 'mens'): Tournament
{
    $tournament = Tournament::create([
        'name' => 'Invite Cup '.uniqid(),
        'organizer_name' => 'Invite Org',
    ]);

    $tournament->categories()->create([
        'name' => ucfirst($skillLevel).' '.$division,
        'division' => $division,
        'skill_level' => $skillLevel,
        'rr_points_to_win' => 11,
        'elim_points_to_win' => 15,
        'bracket_size' => 4,
        'teams_advancing_per_bracket' => 1,
    ]);

    $tournament->update(['status' => TournamentStatus::RegistrationOpen]);

    return $tournament->fresh('categories');
}

function makeInvitePlayer(string $email): User
{
    $user = User::factory()->create(['email' => $email]);
    $user->assignRole(Role::PLAYER);

    return $user;
}

function captainRegistersPairTeam(Tournament $tournament, User $captain, string $partnerName = 'Pending Partner'): TournamentTeam
{
    $category = $tournament->categories->first();

    return tap(TournamentTeam::create([
        'tournament_category_id' => $category->id,
        'display_name' => $captain->name.' & '.$partnerName,
        'captain_email' => $captain->email,
        'partner_token' => 'test-token-'.uniqid(),
        'status' => TournamentTeam::STATUS_ACTIVE,
    ]), function (TournamentTeam $team) use ($captain, $partnerName) {
        $team->players()->create([
            'user_id' => $captain->id,
            'display_name' => $captain->name,
            'is_captain' => true,
        ]);
        $team->players()->create([
            'user_id' => null,
            'display_name' => $partnerName,
            'is_captain' => false,
        ]);
    });
}

test('authenticated player claims the partner slot using a raw token', function () {
    $tournament = openTournamentForInvite();
    $captain = makeInvitePlayer('captain@example.com');
    $partner = makeInvitePlayer('partner@example.com');
    $team = captainRegistersPairTeam($tournament, $captain);

    $response = $this->actingAs($partner)->post(
        route('player.tournaments.accept-invite', ['tournament' => $tournament->slug]),
        ['partner_invite' => $team->partner_token],
    );

    $response->assertRedirect(route('player.tournaments.show', ['tournament' => $tournament->slug]));

    $team->refresh();
    expect($team->partner_token)->toBeNull();
    expect($team->display_name)->toBe($captain->name.' & '.$partner->name);
    expect($team->players()->where('user_id', $partner->id)->where('is_captain', false)->exists())->toBeTrue();
});

test('authenticated player claims the slot when pasting the full /join/ URL', function () {
    $tournament = openTournamentForInvite();
    $captain = makeInvitePlayer('captain@example.com');
    $partner = makeInvitePlayer('partner@example.com');
    $team = captainRegistersPairTeam($tournament, $captain);

    $response = $this->actingAs($partner)->post(
        route('player.tournaments.accept-invite', ['tournament' => $tournament->slug]),
        ['partner_invite' => 'https://formula11.test/join/'.$team->partner_token],
    );

    $response->assertRedirect();
    $team->refresh();
    expect($team->partner_token)->toBeNull();
    expect($team->players()->where('user_id', $partner->id)->exists())->toBeTrue();
});

test('a token belonging to a different tournament is rejected', function () {
    $tournamentA = openTournamentForInvite();
    $tournamentB = openTournamentForInvite();
    $captain = makeInvitePlayer('captain@example.com');
    $partner = makeInvitePlayer('partner@example.com');
    $team = captainRegistersPairTeam($tournamentA, $captain);

    $response = $this->actingAs($partner)->post(
        route('player.tournaments.accept-invite', ['tournament' => $tournamentB->slug]),
        ['partner_invite' => $team->partner_token],
    );

    $response->assertSessionHasErrors('partner_invite');
    expect($team->fresh()->partner_token)->not->toBeNull();
});

test('an invalid token is rejected', function () {
    $tournament = openTournamentForInvite();
    $partner = makeInvitePlayer('partner@example.com');

    $response = $this->actingAs($partner)->post(
        route('player.tournaments.accept-invite', ['tournament' => $tournament->slug]),
        ['partner_invite' => 'does-not-exist'],
    );

    $response->assertSessionHasErrors('partner_invite');
});

test('the captain cannot accept their own invite', function () {
    $tournament = openTournamentForInvite();
    $captain = makeInvitePlayer('captain@example.com');
    $team = captainRegistersPairTeam($tournament, $captain);

    $response = $this->actingAs($captain)->post(
        route('player.tournaments.accept-invite', ['tournament' => $tournament->slug]),
        ['partner_invite' => $team->partner_token],
    );

    $response->assertSessionHasErrors('partner_invite');
    expect($team->fresh()->partner_token)->not->toBeNull();
});

test('skill-level mismatch within the same tournament is rejected', function () {
    $tournament = Tournament::create(['name' => 'Multi-level Cup']);
    $beginner = $tournament->categories()->create([
        'name' => 'Beginner Mens',
        'division' => 'mens',
        'skill_level' => 'beginner',
        'rr_points_to_win' => 11,
        'elim_points_to_win' => 15,
        'bracket_size' => 4,
        'teams_advancing_per_bracket' => 1,
    ]);
    $novice = $tournament->categories()->create([
        'name' => 'Novice Mens',
        'division' => 'mens',
        'skill_level' => 'novice',
        'rr_points_to_win' => 11,
        'elim_points_to_win' => 15,
        'bracket_size' => 4,
        'teams_advancing_per_bracket' => 1,
    ]);
    $tournament->update(['status' => TournamentStatus::RegistrationOpen]);

    $captain = makeInvitePlayer('captain@example.com');
    $partner = makeInvitePlayer('partner@example.com');

    $existingNoviceTeam = TournamentTeam::create([
        'tournament_category_id' => $novice->id,
        'display_name' => $partner->name.' & TBD',
        'captain_email' => $partner->email,
        'partner_token' => 'novice-token',
        'status' => TournamentTeam::STATUS_ACTIVE,
    ]);
    $existingNoviceTeam->players()->create([
        'user_id' => $partner->id,
        'display_name' => $partner->name,
        'is_captain' => true,
    ]);

    $beginnerTeam = TournamentTeam::create([
        'tournament_category_id' => $beginner->id,
        'display_name' => $captain->name.' & Pending',
        'captain_email' => $captain->email,
        'partner_token' => 'beginner-token',
        'status' => TournamentTeam::STATUS_ACTIVE,
    ]);
    $beginnerTeam->players()->create([
        'user_id' => $captain->id,
        'display_name' => $captain->name,
        'is_captain' => true,
    ]);
    $beginnerTeam->players()->create([
        'user_id' => null,
        'display_name' => 'Pending',
        'is_captain' => false,
    ]);

    $response = $this->actingAs($partner)->post(
        route('player.tournaments.accept-invite', ['tournament' => $tournament->slug]),
        ['partner_invite' => 'beginner-token'],
    );

    $response->assertSessionHasErrors('partner_invite');
    expect($beginnerTeam->fresh()->partner_token)->toBe('beginner-token');
});

test('non-players cannot accept invites', function () {
    $tournament = openTournamentForInvite();
    $captain = makeInvitePlayer('captain@example.com');
    $team = captainRegistersPairTeam($tournament, $captain);
    $stranger = User::factory()->create();

    $response = $this->actingAs($stranger)->post(
        route('player.tournaments.accept-invite', ['tournament' => $tournament->slug]),
        ['partner_invite' => $team->partner_token],
    );

    $response->assertForbidden();
});
