<?php

use App\Models\Role;
use App\Models\Tournament;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(PermissionSeeder::class);
    $this->seed(RoleSeeder::class);
});

function tournamentAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::ADMIN);

    return $user;
}

function tournamentPlayer(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::PLAYER);

    return $user;
}

test('non-admins cannot view the tournaments index', function () {
    $response = $this
        ->actingAs(tournamentPlayer())
        ->get(route('admin.tournaments.index'));

    $response->assertForbidden();
});

test('admins can view the tournaments index', function () {
    $response = $this
        ->actingAs(tournamentAdmin())
        ->get(route('admin.tournaments.index'));

    $response->assertOk();
});

test('admins can create a tournament with auto-generated slug and registration code', function () {
    $admin = tournamentAdmin();

    $response = $this
        ->actingAs($admin)
        ->post(route('admin.tournaments.store'), [
            'name' => 'Inter-HEI Pickleball Cup 2026',
            'organizer_name' => 'GenSan Pickleball Center',
            'venue' => 'Cinco Niñas, Koronadal City',
            'starts_at' => '2026-08-01',
            'ends_at' => '2026-08-03',
        ]);

    $tournament = Tournament::where('name', 'Inter-HEI Pickleball Cup 2026')->first();
    expect($tournament)->not->toBeNull();
    expect($tournament->slug)->toBe('inter-hei-pickleball-cup-2026');
    expect($tournament->registration_code)->toMatch('/^[A-Z0-9]{12}$/');
    expect($tournament->created_by)->toBe($admin->id);
    expect($tournament->status->value)->toBe('draft');
    expect($tournament->organizer_name)->toBe('GenSan Pickleball Center');

    $response->assertRedirect(route('admin.tournaments.show', $tournament));
});

test('organizer_name is optional', function () {
    $response = $this
        ->actingAs(tournamentAdmin())
        ->post(route('admin.tournaments.store'), [
            'name' => 'No Organizer Cup',
        ]);

    $response->assertRedirect();
    $tournament = Tournament::where('name', 'No Organizer Cup')->first();
    expect($tournament->organizer_name)->toBeNull();
});

test('admins can update the organizer_name', function () {
    $tournament = Tournament::create(['name' => 'Set Organizer']);

    $response = $this
        ->actingAs(tournamentAdmin())
        ->patch(route('admin.tournaments.update', $tournament), [
            'name' => 'Set Organizer',
            'organizer_name' => 'New Host Co.',
        ]);

    $response->assertRedirect();
    expect($tournament->fresh()->organizer_name)->toBe('New Host Co.');
});

test('slug collisions get a numeric suffix', function () {
    $admin = tournamentAdmin();

    $this->actingAs($admin)->post(route('admin.tournaments.store'), [
        'name' => 'Cup',
    ]);
    $this->actingAs($admin)->post(route('admin.tournaments.store'), [
        'name' => 'Cup',
    ]);

    $slugs = Tournament::pluck('slug')->all();
    expect($slugs)->toContain('cup');
    expect($slugs)->toContain('cup-1');
});

test('admins can view a tournament', function () {
    $tournament = Tournament::create(['name' => 'Show Me']);

    $response = $this
        ->actingAs(tournamentAdmin())
        ->get(route('admin.tournaments.show', $tournament));

    $response->assertOk();
});

test('admins can update a tournament; slug regenerates on name change', function () {
    $tournament = Tournament::create(['name' => 'Original']);

    $response = $this
        ->actingAs(tournamentAdmin())
        ->patch(route('admin.tournaments.update', $tournament), [
            'name' => 'Renamed',
            'venue' => 'New venue',
        ]);

    $response->assertRedirect();
    expect($tournament->fresh()->name)->toBe('Renamed');
    expect($tournament->fresh()->slug)->toBe('renamed');
});

test('end date must be on or after start date', function () {
    $response = $this
        ->actingAs(tournamentAdmin())
        ->post(route('admin.tournaments.store'), [
            'name' => 'Bad Dates',
            'starts_at' => '2026-08-10',
            'ends_at' => '2026-08-01',
        ]);

    $response->assertSessionHasErrors('ends_at');
});

test('admins can soft delete a tournament', function () {
    $tournament = Tournament::create(['name' => 'Trash Me']);

    $response = $this
        ->actingAs(tournamentAdmin())
        ->delete(route('admin.tournaments.destroy', $tournament));

    $response->assertRedirect(route('admin.tournaments.index'));
    $this->assertSoftDeleted('tournaments', ['id' => $tournament->id]);
});

test('non-admins cannot create a tournament', function () {
    $response = $this
        ->actingAs(tournamentPlayer())
        ->post(route('admin.tournaments.store'), [
            'name' => 'Sneaky',
        ]);

    $response->assertForbidden();
});

test('tournament uses soft deletes', function () {
    expect(class_uses(Tournament::class))->toHaveKey('Illuminate\\Database\\Eloquent\\SoftDeletes');
});
