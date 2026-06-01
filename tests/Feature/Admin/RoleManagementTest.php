<?php

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(PermissionSeeder::class);
    $this->seed(RoleSeeder::class);
});

function makeAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::ADMIN);

    return $user;
}

function makePlayer(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::PLAYER);

    return $user;
}

test('non-admins cannot view the roles page', function () {
    $response = $this
        ->actingAs(makePlayer())
        ->get(route('admin.roles.index'));

    $response->assertForbidden();
});

test('admins can view the roles page', function () {
    $response = $this
        ->actingAs(makeAdmin())
        ->get(route('admin.roles.index'));

    $response->assertOk();
});

test('admins can create a custom role with permissions', function () {
    $response = $this
        ->actingAs(makeAdmin())
        ->post(route('admin.roles.store'), [
            'label' => 'Tournament Director',
            'name' => 'tournament_director',
            'description' => 'Runs tournament operations.',
            'permissions' => ['users.view', 'dashboard.view'],
        ]);

    $response->assertRedirect(route('admin.roles.index'));

    $role = Role::where('name', 'tournament_director')->first();
    expect($role)->not->toBeNull();
    expect($role->is_system)->toBeFalse();
    expect($role->permissions->pluck('name')->all())
        ->toContain('users.view', 'dashboard.view');
});

test('role name must be unique', function () {
    $response = $this
        ->actingAs(makeAdmin())
        ->post(route('admin.roles.store'), [
            'label' => 'Another Admin',
            'name' => Role::ADMIN,
            'description' => null,
            'permissions' => [],
        ]);

    $response->assertSessionHasErrors('name');
});

test('role name only allows lowercase letters numbers and underscores', function () {
    $response = $this
        ->actingAs(makeAdmin())
        ->post(route('admin.roles.store'), [
            'label' => 'Bad Name',
            'name' => 'Bad Name!',
            'description' => null,
            'permissions' => [],
        ]);

    $response->assertSessionHasErrors('name');
});

test('admins can update a custom role permissions', function () {
    $role = Role::create([
        'name' => 'reporter',
        'label' => 'Reporter',
        'description' => null,
        'is_system' => false,
    ]);

    $response = $this
        ->actingAs(makeAdmin())
        ->patch(route('admin.roles.update', $role), [
            'label' => 'Reporter',
            'name' => 'reporter',
            'description' => 'Reports tournament results.',
            'permissions' => ['users.view'],
        ]);

    $response->assertRedirect(route('admin.roles.index'));
    expect($role->fresh()->permissions->pluck('name')->all())
        ->toBe(['users.view']);
});

test('updating a system role does not change its name', function () {
    $umpire = Role::where('name', Role::UMPIRE)->first();

    $response = $this
        ->actingAs(makeAdmin())
        ->patch(route('admin.roles.update', $umpire), [
            'label' => 'Field Judge',
            'name' => 'field_judge',
            'description' => 'Renamed via UI.',
            'permissions' => ['dashboard.view'],
        ]);

    $response->assertRedirect();
    expect($umpire->fresh()->name)->toBe(Role::UMPIRE);
});

test('super admin role always retains every permission after update', function () {
    $super = Role::where('name', Role::SUPER_ADMIN)->first();
    $allPermissionCount = Permission::count();

    $response = $this
        ->actingAs(makeAdmin())
        ->patch(route('admin.roles.update', $super), [
            'label' => 'Super Admin',
            'name' => Role::SUPER_ADMIN,
            'description' => 'New description',
            'permissions' => ['users.view'],
        ]);

    $response->assertRedirect();
    expect($super->fresh()->permissions()->count())->toBe($allPermissionCount);
});

test('admins cannot delete a system role', function () {
    $admin = makeAdmin();
    $playerRole = Role::where('name', Role::PLAYER)->first();

    $response = $this
        ->actingAs($admin)
        ->delete(route('admin.roles.destroy', $playerRole));

    $response->assertForbidden();
    $this->assertDatabaseHas('roles', ['id' => $playerRole->id]);
});

test('admins cannot delete because they lack roles.delete permission', function () {
    $admin = makeAdmin();
    $custom = Role::create([
        'name' => 'custom_role',
        'label' => 'Custom',
        'description' => null,
        'is_system' => false,
    ]);

    $response = $this
        ->actingAs($admin)
        ->delete(route('admin.roles.destroy', $custom));

    $response->assertForbidden();
});

test('super admin can delete a custom role', function () {
    $super = User::factory()->create();
    $super->assignRole(Role::SUPER_ADMIN);

    $custom = Role::create([
        'name' => 'custom_role',
        'label' => 'Custom',
        'description' => null,
        'is_system' => false,
    ]);

    $response = $this
        ->actingAs($super)
        ->delete(route('admin.roles.destroy', $custom));

    $response->assertRedirect(route('admin.roles.index'));
    $this->assertDatabaseMissing('roles', ['id' => $custom->id]);
});
