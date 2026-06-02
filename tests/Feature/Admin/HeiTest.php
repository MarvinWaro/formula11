<?php

use App\Models\Hei;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\HeiSeeder;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(PermissionSeeder::class);
    $this->seed(RoleSeeder::class);
});

function heiAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::ADMIN);

    return $user;
}

function heiPlayer(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::PLAYER);

    return $user;
}

test('non-admins cannot view the HEIs page', function () {
    $response = $this
        ->actingAs(heiPlayer())
        ->get(route('admin.heis.index'));

    $response->assertForbidden();
});

test('admins can view the HEIs page', function () {
    $response = $this
        ->actingAs(heiAdmin())
        ->get(route('admin.heis.index'));

    $response->assertOk();
});

test('admins can create an HEI', function () {
    $response = $this
        ->actingAs(heiAdmin())
        ->post(route('admin.heis.store'), [
            'name' => 'Mindanao Polytechnic State University',
            'abbreviation' => 'MPSU',
            'region' => 'Region XIII',
        ]);

    $response->assertRedirect(route('admin.heis.index'));

    $this->assertDatabaseHas('heis', [
        'name' => 'Mindanao Polytechnic State University',
        'abbreviation' => 'MPSU',
        'region' => 'Region XIII',
    ]);
});

test('HEI name must be unique', function () {
    Hei::create([
        'name' => 'Duplicate HEI',
        'abbreviation' => 'DUP',
        'region' => 'Region XII',
    ]);

    $response = $this
        ->actingAs(heiAdmin())
        ->post(route('admin.heis.store'), [
            'name' => 'Duplicate HEI',
            'abbreviation' => 'DUP2',
            'region' => 'Region XII',
        ]);

    $response->assertSessionHasErrors('name');
});

test('abbreviation and region are optional', function () {
    $response = $this
        ->actingAs(heiAdmin())
        ->post(route('admin.heis.store'), [
            'name' => 'Minimal HEI',
        ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('heis', [
        'name' => 'Minimal HEI',
        'abbreviation' => null,
        'region' => null,
    ]);
});

test('admins can update an HEI', function () {
    $hei = Hei::create([
        'name' => 'Old Name',
        'abbreviation' => 'OLD',
        'region' => 'Region XII',
    ]);

    $response = $this
        ->actingAs(heiAdmin())
        ->patch(route('admin.heis.update', $hei), [
            'name' => 'New Name',
            'abbreviation' => 'NEW',
            'region' => 'Region XII',
        ]);

    $response->assertRedirect(route('admin.heis.index'));
    expect($hei->fresh()->name)->toBe('New Name');
    expect($hei->fresh()->abbreviation)->toBe('NEW');
});

test('updating an HEI ignores its own name in the unique check', function () {
    $hei = Hei::create([
        'name' => 'Same Name',
        'abbreviation' => 'SN',
        'region' => 'Region XII',
    ]);

    $response = $this
        ->actingAs(heiAdmin())
        ->patch(route('admin.heis.update', $hei), [
            'name' => 'Same Name',
            'abbreviation' => 'SN-2',
            'region' => 'Region XII',
        ]);

    $response->assertRedirect();
    expect($hei->fresh()->abbreviation)->toBe('SN-2');
});

test('admins can delete an HEI', function () {
    $hei = Hei::create([
        'name' => 'To Delete',
        'abbreviation' => 'TD',
        'region' => 'Region XII',
    ]);

    $response = $this
        ->actingAs(heiAdmin())
        ->delete(route('admin.heis.destroy', $hei));

    $response->assertRedirect(route('admin.heis.index'));
    $this->assertDatabaseMissing('heis', ['id' => $hei->id]);
});

test('non-admins cannot create an HEI', function () {
    $response = $this
        ->actingAs(heiPlayer())
        ->post(route('admin.heis.store'), [
            'name' => 'Should Fail',
        ]);

    $response->assertForbidden();
});

test('non-admins cannot delete an HEI', function () {
    $hei = Hei::create([
        'name' => 'Locked HEI',
        'abbreviation' => 'LH',
        'region' => 'Region XII',
    ]);

    $response = $this
        ->actingAs(heiPlayer())
        ->delete(route('admin.heis.destroy', $hei));

    $response->assertForbidden();
    $this->assertDatabaseHas('heis', ['id' => $hei->id]);
});

test('HEI seeder populates the base registry', function () {
    $this->seed(HeiSeeder::class);

    expect(Hei::count())->toBeGreaterThanOrEqual(19);
    expect(Hei::where('name', 'Sultan Kudarat State University')->exists())->toBeTrue();
    expect(Hei::where('abbreviation', 'MIST')->exists())->toBeTrue();
});
