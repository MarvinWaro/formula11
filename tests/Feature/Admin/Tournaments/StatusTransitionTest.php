<?php

use App\Actions\Tournaments\TransitionTournamentStatus;
use App\Enums\TournamentStatus;
use App\Models\Role;
use App\Models\Tournament;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(PermissionSeeder::class);
    $this->seed(RoleSeeder::class);
});

function transitionAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::ADMIN);

    return $user;
}

test('a draft tournament cannot open registration without categories', function () {
    $tournament = Tournament::create(['name' => 'No Cats']);

    expect(fn () => app(TransitionTournamentStatus::class)->handle(
        $tournament,
        TournamentStatus::RegistrationOpen,
    ))->toThrow(RuntimeException::class);
});

test('a draft tournament opens registration once it has a category', function () {
    $tournament = Tournament::create(['name' => 'Has Cats']);
    $tournament->categories()->create([
        'name' => "Beginner's Mens",
        'division' => 'mens',
        'skill_level' => 'beginner',
        'rr_points_to_win' => 11,
        'elim_points_to_win' => 15,
        'bracket_size' => 4,
        'teams_advancing_per_bracket' => 1,
    ]);

    $updated = app(TransitionTournamentStatus::class)->handle(
        $tournament,
        TournamentStatus::RegistrationOpen,
    );

    expect($updated->status)->toBe(TournamentStatus::RegistrationOpen);
});

test('status cannot move backward', function () {
    $tournament = Tournament::create(['name' => 'No Going Back']);
    $tournament->categories()->create([
        'name' => 'Cat',
        'division' => 'mens',
        'skill_level' => 'beginner',
        'rr_points_to_win' => 11,
        'elim_points_to_win' => 15,
        'bracket_size' => 4,
        'teams_advancing_per_bracket' => 1,
    ]);

    app(TransitionTournamentStatus::class)->handle(
        $tournament,
        TournamentStatus::RegistrationOpen,
    );

    expect(fn () => app(TransitionTournamentStatus::class)->handle(
        $tournament->fresh(),
        TournamentStatus::Draft,
    ))->toThrow(RuntimeException::class);
});

test('status must progress one step at a time', function () {
    $tournament = Tournament::create(['name' => 'No Skipping']);
    $tournament->categories()->create([
        'name' => 'Cat',
        'division' => 'mens',
        'skill_level' => 'beginner',
        'rr_points_to_win' => 11,
        'elim_points_to_win' => 15,
        'bracket_size' => 4,
        'teams_advancing_per_bracket' => 1,
    ]);

    expect(fn () => app(TransitionTournamentStatus::class)->handle(
        $tournament,
        TournamentStatus::InProgress,
    ))->toThrow(RuntimeException::class);
});

test('the advance endpoint moves the tournament forward', function () {
    $tournament = Tournament::create(['name' => 'Forward']);
    $tournament->categories()->create([
        'name' => 'Cat',
        'division' => 'mens',
        'skill_level' => 'beginner',
        'rr_points_to_win' => 11,
        'elim_points_to_win' => 15,
        'bracket_size' => 4,
        'teams_advancing_per_bracket' => 1,
    ]);

    $response = $this
        ->actingAs(transitionAdmin())
        ->post(route('admin.tournaments.advance', $tournament), [
            'status' => TournamentStatus::RegistrationOpen->value,
        ]);

    $response->assertRedirect();
    expect($tournament->fresh()->status)->toBe(TournamentStatus::RegistrationOpen);
});

test('the advance endpoint returns a validation error when guards fail', function () {
    $tournament = Tournament::create(['name' => 'Blocked']);

    $response = $this
        ->actingAs(transitionAdmin())
        ->from(route('admin.tournaments.show', $tournament))
        ->post(route('admin.tournaments.advance', $tournament), [
            'status' => TournamentStatus::RegistrationOpen->value,
        ]);

    $response->assertSessionHasErrors('status');
});
