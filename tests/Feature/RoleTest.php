<?php

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
});

test('role seeder creates the four base roles', function () {
    expect(Role::query()->pluck('name')->all())
        ->toContain(Role::SUPER_ADMIN, Role::ADMIN, Role::UMPIRE, Role::PLAYER);
});

test('role seeder is idempotent', function () {
    $this->seed(RoleSeeder::class);
    $this->seed(RoleSeeder::class);

    expect(Role::query()->count())->toBe(5);
});

test('a user can be assigned a single role', function () {
    $user = User::factory()->create();

    $user->assignRole(Role::UMPIRE);

    expect($user->hasRole(Role::UMPIRE))->toBeTrue();
    expect($user->hasRole(Role::PLAYER))->toBeFalse();
});

test('a user can be assigned multiple roles', function () {
    $user = User::factory()->create();

    $user->assignRole([Role::UMPIRE, Role::PLAYER]);

    expect($user->hasRole(Role::UMPIRE))->toBeTrue();
    expect($user->hasRole(Role::PLAYER))->toBeTrue();
    expect($user->roles)->toHaveCount(2);
});

test('assigning the same role twice does not duplicate the pivot row', function () {
    $user = User::factory()->create();

    $user->assignRole(Role::ADMIN);
    $user->assignRole(Role::ADMIN);

    expect($user->roles()->where('name', Role::ADMIN)->count())->toBe(1);
});

test('hasAnyRole returns true when the user has at least one of the given roles', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::PLAYER);

    expect($user->hasAnyRole([Role::ADMIN, Role::PLAYER]))->toBeTrue();
    expect($user->hasAnyRole([Role::ADMIN, Role::SUPER_ADMIN]))->toBeFalse();
});

test('syncRoles replaces the user roles', function () {
    $user = User::factory()->create();
    $user->assignRole([Role::PLAYER, Role::UMPIRE]);

    $user->syncRoles([Role::ADMIN]);

    expect($user->roleNames()->all())->toEqual([Role::ADMIN]);
});

test('removeRole detaches the role from the user', function () {
    $user = User::factory()->create();
    $user->assignRole([Role::PLAYER, Role::UMPIRE]);

    $user->removeRole(Role::PLAYER);

    expect($user->hasRole(Role::PLAYER))->toBeFalse();
    expect($user->hasRole(Role::UMPIRE))->toBeTrue();
});

test('force-deleting a user cascades the role pivot rows', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::ADMIN);

    $userId = $user->id;
    $user->forceDelete();

    $this->assertDatabaseMissing('role_user', ['user_id' => $userId]);
});

test('soft-deleting a user keeps the role pivot rows', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::ADMIN);

    $user->delete();

    $this->assertDatabaseHas('role_user', ['user_id' => $user->id]);
    $this->assertSoftDeleted('users', ['id' => $user->id]);
});

test('deleting a role cascades the role pivot rows', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::ADMIN);

    $role = Role::query()->where('name', Role::ADMIN)->first();
    $role->delete();

    $this->assertDatabaseMissing('role_user', ['role_id' => $role->id]);
});
