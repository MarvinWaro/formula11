<?php

use App\Models\Role;
use App\Models\Tournament;
use App\Models\TournamentCategory;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(PermissionSeeder::class);
    $this->seed(RoleSeeder::class);
});

function catAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::ADMIN);

    return $user;
}

function catPlayer(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::PLAYER);

    return $user;
}

function makeTournament(): Tournament
{
    return Tournament::create(['name' => 'Test Cup']);
}

test('admins can create a category', function () {
    $tournament = makeTournament();

    $response = $this
        ->actingAs(catAdmin())
        ->post(route('admin.tournaments.categories.store', $tournament), [
            'name' => "Beginner's Mens",
            'division' => 'mens',
            'skill_level' => 'beginner',
            'rr_points_to_win' => 11,
            'elim_points_to_win' => 15,
            'bracket_size' => 4,
            'teams_advancing_per_bracket' => 1,
            'max_teams' => null,
        ]);

    $response->assertRedirect(route('admin.tournaments.show', $tournament));

    $category = $tournament->categories()->first();
    expect($category)->not->toBeNull();
    expect($category->slug)->toBe('beginners-mens');
    expect($category->division->value)->toBe('mens');
    expect($category->skill_level->value)->toBe('beginner');
});

test('category requires valid division', function () {
    $tournament = makeTournament();

    $response = $this
        ->actingAs(catAdmin())
        ->post(route('admin.tournaments.categories.store', $tournament), [
            'name' => 'Bad Division',
            'division' => 'unicycle',
            'skill_level' => 'beginner',
            'rr_points_to_win' => 11,
            'elim_points_to_win' => 15,
            'bracket_size' => 4,
            'teams_advancing_per_bracket' => 1,
        ]);

    $response->assertSessionHasErrors('division');
});

test('category requires valid skill level', function () {
    $tournament = makeTournament();

    $response = $this
        ->actingAs(catAdmin())
        ->post(route('admin.tournaments.categories.store', $tournament), [
            'name' => 'Bad Skill',
            'division' => 'mens',
            'skill_level' => 'godlike',
            'rr_points_to_win' => 11,
            'elim_points_to_win' => 15,
            'bracket_size' => 4,
            'teams_advancing_per_bracket' => 1,
        ]);

    $response->assertSessionHasErrors('skill_level');
});

test('admins can update a category', function () {
    $tournament = makeTournament();
    $category = $tournament->categories()->create([
        'name' => 'Original',
        'division' => 'mens',
        'skill_level' => 'beginner',
        'rr_points_to_win' => 11,
        'elim_points_to_win' => 15,
        'bracket_size' => 4,
        'teams_advancing_per_bracket' => 1,
    ]);

    $response = $this
        ->actingAs(catAdmin())
        ->patch(route('admin.tournaments.categories.update', [$tournament, $category]), [
            'name' => 'Renamed Mixed',
            'division' => 'mixed',
            'skill_level' => 'novice',
            'rr_points_to_win' => 11,
            'elim_points_to_win' => 21,
            'bracket_size' => 6,
            'teams_advancing_per_bracket' => 2,
        ]);

    $response->assertRedirect();
    $category->refresh();
    expect($category->name)->toBe('Renamed Mixed');
    expect($category->division->value)->toBe('mixed');
    expect($category->skill_level->value)->toBe('novice');
    expect($category->bracket_size)->toBe(6);
    expect($category->slug)->toBe('renamed-mixed');
});

test('admins can delete a category', function () {
    $tournament = makeTournament();
    $category = $tournament->categories()->create([
        'name' => 'Delete me',
        'division' => 'mens',
        'skill_level' => 'beginner',
        'rr_points_to_win' => 11,
        'elim_points_to_win' => 15,
        'bracket_size' => 4,
        'teams_advancing_per_bracket' => 1,
    ]);

    $response = $this
        ->actingAs(catAdmin())
        ->delete(route('admin.tournaments.categories.destroy', [$tournament, $category]));

    $response->assertRedirect(route('admin.tournaments.show', $tournament));
    $this->assertDatabaseMissing('tournament_categories', ['id' => $category->id]);
});

test('non-admins cannot create a category', function () {
    $tournament = makeTournament();

    $response = $this
        ->actingAs(catPlayer())
        ->post(route('admin.tournaments.categories.store', $tournament), [
            'name' => 'Sneaky',
            'division' => 'mens',
            'skill_level' => 'beginner',
            'rr_points_to_win' => 11,
            'elim_points_to_win' => 15,
            'bracket_size' => 4,
            'teams_advancing_per_bracket' => 1,
        ]);

    $response->assertForbidden();
});

test('updating mismatched tournament/category returns 404', function () {
    $tournament1 = Tournament::create(['name' => 'One']);
    $tournament2 = Tournament::create(['name' => 'Two']);
    $category = $tournament2->categories()->create([
        'name' => 'Belongs to two',
        'division' => 'mens',
        'skill_level' => 'beginner',
        'rr_points_to_win' => 11,
        'elim_points_to_win' => 15,
        'bracket_size' => 4,
        'teams_advancing_per_bracket' => 1,
    ]);

    $response = $this
        ->actingAs(catAdmin())
        ->patch(route('admin.tournaments.categories.update', [$tournament1, $category]), [
            'name' => 'Anything',
            'division' => 'mens',
            'skill_level' => 'beginner',
            'rr_points_to_win' => 11,
            'elim_points_to_win' => 15,
            'bracket_size' => 4,
            'teams_advancing_per_bracket' => 1,
        ]);

    $response->assertNotFound();
});

test('deleting a tournament cascades its categories', function () {
    $tournament = makeTournament();
    $tournament->categories()->create([
        'name' => 'About to vanish',
        'division' => 'mens',
        'skill_level' => 'beginner',
        'rr_points_to_win' => 11,
        'elim_points_to_win' => 15,
        'bracket_size' => 4,
        'teams_advancing_per_bracket' => 1,
    ]);

    $tournament->forceDelete();

    expect(TournamentCategory::count())->toBe(0);
});
