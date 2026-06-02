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

function courtOwner(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::COURT_OWNER);

    return $user;
}

function someAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::ADMIN);

    return $user;
}

test('court_owner role exists with tournaments management permissions', function () {
    $role = Role::where('name', Role::COURT_OWNER)->first();

    expect($role)->not->toBeNull();
    expect($role->is_system)->toBeTrue();
    expect($role->permissions->pluck('name')->all())
        ->toContain('tournaments.create', 'tournaments.edit', 'tournaments.manage');
});

test('court owners can create their own tournament', function () {
    $owner = courtOwner();

    $response = $this
        ->actingAs($owner)
        ->post(route('admin.tournaments.store'), [
            'name' => 'Pag-ibig Court Open',
            'organizer_name' => 'Pag-ibig Pickleball Court',
        ]);

    $tournament = Tournament::where('name', 'Pag-ibig Court Open')->first();
    expect($tournament)->not->toBeNull();
    expect($tournament->created_by)->toBe($owner->id);

    $response->assertRedirect(route('admin.tournaments.show', $tournament));
});

test('court owners only see their own tournaments on the index', function () {
    $owner = courtOwner();
    $otherOwner = courtOwner();

    $ownTournament = Tournament::create([
        'name' => 'Mine',
        'created_by' => $owner->id,
    ]);
    Tournament::create([
        'name' => 'Theirs',
        'created_by' => $otherOwner->id,
    ]);

    $response = $this->actingAs($owner)->get(route('admin.tournaments.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tournaments/index')
        ->where('tournaments', fn ($tournaments) => collect($tournaments)
            ->pluck('id')->all() === [$ownTournament->id]),
    );
});

test('court owners cannot view another owners tournament', function () {
    $owner = courtOwner();
    $stranger = courtOwner();

    $strangers = Tournament::create([
        'name' => 'Not yours',
        'created_by' => $stranger->id,
    ]);

    $response = $this->actingAs($owner)->get(route('admin.tournaments.show', $strangers));

    $response->assertForbidden();
});

test('court owners cannot edit another owners tournament', function () {
    $owner = courtOwner();
    $stranger = courtOwner();

    $strangers = Tournament::create([
        'name' => 'Strangers Cup',
        'created_by' => $stranger->id,
    ]);

    $response = $this->actingAs($owner)->patch(route('admin.tournaments.update', $strangers), [
        'name' => 'Stolen',
    ]);

    $response->assertForbidden();
});

test('court owners can edit their own tournament', function () {
    $owner = courtOwner();
    $tournament = Tournament::create([
        'name' => 'Original',
        'created_by' => $owner->id,
    ]);

    $response = $this->actingAs($owner)->patch(route('admin.tournaments.update', $tournament), [
        'name' => 'Renamed',
    ]);

    $response->assertRedirect();
    expect($tournament->fresh()->name)->toBe('Renamed');
});

test('admins see every tournament regardless of ownership', function () {
    $owner = courtOwner();
    $owned = Tournament::create([
        'name' => 'Court Owners Cup',
        'created_by' => $owner->id,
    ]);
    $unowned = Tournament::create(['name' => 'Floating Cup']);

    $response = $this->actingAs(someAdmin())->get(route('admin.tournaments.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('tournaments', fn ($tournaments) => collect($tournaments)
            ->pluck('id')
            ->contains($owned->id)
            && collect($tournaments)->pluck('id')->contains($unowned->id),
        ),
    );
});

test('players cannot create a tournament', function () {
    $player = User::factory()->create();
    $player->assignRole(Role::PLAYER);

    $response = $this->actingAs($player)->post(route('admin.tournaments.store'), [
        'name' => 'Nope',
    ]);

    $response->assertForbidden();
});
