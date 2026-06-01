<?php

use App\Models\Role;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(PermissionSeeder::class);
    $this->seed(RoleSeeder::class);
});

function adminUser(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::ADMIN);

    return $user;
}

function regularUser(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::PLAYER);

    return $user;
}

test('non-admins cannot view the users page', function () {
    $response = $this
        ->actingAs(regularUser())
        ->get(route('admin.users.index'));

    $response->assertForbidden();
});

test('admins can view the users page', function () {
    $response = $this
        ->actingAs(adminUser())
        ->get(route('admin.users.index'));

    $response->assertOk();
});

test('admins can create a user with roles', function () {
    $response = $this
        ->actingAs(adminUser())
        ->post(route('admin.users.store'), [
            'name' => 'New Player',
            'email' => 'new-player@example.com',
            'password' => 'password123',
            'roles' => [Role::PLAYER, Role::UMPIRE],
        ]);

    $response->assertRedirect(route('admin.users.index'));

    $user = User::where('email', 'new-player@example.com')->first();
    expect($user)->not->toBeNull();
    expect($user->hasRole(Role::PLAYER))->toBeTrue();
    expect($user->hasRole(Role::UMPIRE))->toBeTrue();
});

test('user creation requires a unique email', function () {
    User::factory()->create(['email' => 'taken@example.com']);

    $response = $this
        ->actingAs(adminUser())
        ->post(route('admin.users.store'), [
            'name' => 'Dup',
            'email' => 'taken@example.com',
            'password' => 'password123',
            'roles' => [],
        ]);

    $response->assertSessionHasErrors('email');
});

test('admins can update a user and change roles', function () {
    $target = User::factory()->create();
    $target->assignRole(Role::PLAYER);

    $response = $this
        ->actingAs(adminUser())
        ->patch(route('admin.users.update', $target), [
            'name' => 'Renamed',
            'email' => $target->email,
            'roles' => [Role::UMPIRE],
        ]);

    $response->assertRedirect(route('admin.users.index'));

    $target->refresh();
    expect($target->name)->toBe('Renamed');
    expect($target->hasRole(Role::UMPIRE))->toBeTrue();
    expect($target->hasRole(Role::PLAYER))->toBeFalse();
});

test('updating without a password keeps the existing password', function () {
    $target = User::factory()->create(['password' => bcrypt('original')]);
    $hashBefore = $target->password;

    $response = $this
        ->actingAs(adminUser())
        ->patch(route('admin.users.update', $target), [
            'name' => $target->name,
            'email' => $target->email,
            'password' => null,
            'roles' => [],
        ]);

    $response->assertRedirect();
    expect($target->fresh()->password)->toBe($hashBefore);
});

test('admins can soft delete a user', function () {
    $target = User::factory()->create();

    $response = $this
        ->actingAs(adminUser())
        ->delete(route('admin.users.destroy', $target));

    $response->assertRedirect(route('admin.users.index'));
    $this->assertSoftDeleted('users', ['id' => $target->id]);
});

test('admins cannot delete themselves', function () {
    $admin = adminUser();

    $response = $this
        ->actingAs($admin)
        ->delete(route('admin.users.destroy', $admin));

    $response->assertForbidden();
    $this->assertDatabaseHas('users', ['id' => $admin->id]);
});

test('admins cannot delete super admins', function () {
    $super = User::factory()->create();
    $super->assignRole(Role::SUPER_ADMIN);

    $response = $this
        ->actingAs(adminUser())
        ->delete(route('admin.users.destroy', $super));

    $response->assertForbidden();
});

test('regular users cannot store a new user', function () {
    $response = $this
        ->actingAs(regularUser())
        ->post(route('admin.users.store'), [
            'name' => 'Sneaky',
            'email' => 'sneaky@example.com',
            'password' => 'password123',
            'roles' => [],
        ]);

    $response->assertForbidden();
});
