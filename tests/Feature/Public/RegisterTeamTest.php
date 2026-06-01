<?php

use App\Enums\TournamentStatus;
use App\Models\Hei;
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

function openTournamentWithCategory(?int $maxTeams = null, ?float $fee = null): Tournament
{
    $tournament = Tournament::create([
        'name' => 'Pag-ibig Open',
        'organizer_name' => 'Pag-ibig Pickleball Court',
    ]);

    $tournament->categories()->create([
        'name' => 'Beginners Mens',
        'division' => 'mens',
        'skill_level' => 'beginner',
        'rr_points_to_win' => 11,
        'elim_points_to_win' => 15,
        'bracket_size' => 4,
        'teams_advancing_per_bracket' => 1,
        'max_teams' => $maxTeams,
        'registration_fee' => $fee,
    ]);

    $tournament->update(['status' => TournamentStatus::RegistrationOpen]);

    return $tournament->fresh('categories');
}

test('the public registration page shows tournament info', function () {
    $tournament = openTournamentWithCategory();

    $response = $this->get(route('public.register.show', $tournament->registration_code));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('register/show')
        ->where('tournament.name', $tournament->name)
        ->where('tournament.registration_open', true)
        ->where('categories.0.name', 'Beginners Mens'),
    );
});

test('a stranger can register a team and an account is created with player role', function () {
    $tournament = openTournamentWithCategory();
    $category = $tournament->categories->first();

    $response = $this->post(route('public.register.store', $tournament->registration_code), [
        'category_id' => $category->id,
        'captain_name' => 'Juan dela Cruz',
        'captain_email' => 'juan@example.com',
        'captain_phone' => '09171234567',
        'captain_password' => 'secret123',
        'partner_name' => 'Maria Clara',
    ]);

    $team = TournamentTeam::first();
    expect($team)->not->toBeNull();
    expect($team->display_name)->toBe('Juan dela Cruz & Maria Clara');
    expect($team->players()->count())->toBe(2);

    $captain = User::where('email', 'juan@example.com')->first();
    expect($captain)->not->toBeNull();
    expect($captain->hasRole(Role::PLAYER))->toBeTrue();

    $response->assertRedirect(route('public.register.success', [
        'code' => $tournament->registration_code,
        'team' => $team->id,
    ]));
});

test('an existing email is rejected with a hint to sign in', function () {
    $tournament = openTournamentWithCategory();
    $category = $tournament->categories->first();

    User::factory()->create(['email' => 'taken@example.com']);

    $response = $this->post(route('public.register.store', $tournament->registration_code), [
        'category_id' => $category->id,
        'captain_name' => 'Already Existing',
        'captain_email' => 'taken@example.com',
        'captain_password' => 'secret123',
        'partner_name' => 'Partner',
    ]);

    $response->assertSessionHasErrors('captain_email');
    expect(TournamentTeam::count())->toBe(0);
});

test('registration is rejected when the tournament is not open', function () {
    $tournament = Tournament::create(['name' => 'Closed Cup']);
    $category = $tournament->categories()->create([
        'name' => 'Cat',
        'division' => 'mens',
        'skill_level' => 'beginner',
        'rr_points_to_win' => 11,
        'elim_points_to_win' => 15,
        'bracket_size' => 4,
        'teams_advancing_per_bracket' => 1,
    ]);

    $response = $this->post(route('public.register.store', $tournament->registration_code), [
        'category_id' => $category->id,
        'captain_name' => 'X',
        'captain_email' => 'x@example.com',
        'captain_password' => 'secret123',
        'partner_name' => 'Y',
    ]);

    $response->assertSessionHasErrors('tournament');
    expect(TournamentTeam::count())->toBe(0);
});

test('registration enforces the category cap', function () {
    $tournament = openTournamentWithCategory(maxTeams: 1);
    $category = $tournament->categories->first();

    $category->teams()->create([
        'display_name' => 'Existing',
        'captain_email' => 'existing@example.com',
        'status' => TournamentTeam::STATUS_ACTIVE,
    ]);

    $response = $this->post(route('public.register.store', $tournament->registration_code), [
        'category_id' => $category->id,
        'captain_name' => 'New',
        'captain_email' => 'new@example.com',
        'captain_password' => 'secret123',
        'partner_name' => 'Partner',
    ]);

    $response->assertSessionHasErrors('category_id');
});

test('authenticated users skip the password field', function () {
    $tournament = openTournamentWithCategory();
    $category = $tournament->categories->first();

    $existing = User::factory()->create();
    $existing->assignRole(Role::PLAYER);

    $response = $this
        ->actingAs($existing)
        ->post(route('public.register.store', $tournament->registration_code), [
            'category_id' => $category->id,
            'captain_name' => $existing->name,
            'captain_email' => $existing->email,
            'partner_name' => 'New Partner',
        ]);

    $response->assertRedirect();
    expect(TournamentTeam::count())->toBe(1);
    $team = TournamentTeam::first();
    expect($team->players()->where('user_id', $existing->id)->where('is_captain', true)->exists())->toBeTrue();
});

test('an invalid category id is rejected', function () {
    $tournament = openTournamentWithCategory();

    $response = $this->post(route('public.register.store', $tournament->registration_code), [
        'category_id' => 9999,
        'captain_name' => 'X',
        'captain_email' => 'x@example.com',
        'captain_password' => 'secret123',
        'partner_name' => 'Y',
    ]);

    $response->assertSessionHasErrors('category_id');
});

test('an unknown registration code returns 404', function () {
    $response = $this->get('/register/ZZZ999XYZ123');

    $response->assertNotFound();
});

test('the show page lists HEIs from the registry', function () {
    Hei::create(['name' => 'Sample HEI', 'abbreviation' => 'SH']);

    $tournament = openTournamentWithCategory();

    $response = $this->get(route('public.register.show', $tournament->registration_code));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('heis.0.name', fn ($name) => is_string($name)),
    );
});
