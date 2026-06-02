<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => Role::SUPER_ADMIN,
                'label' => 'Super Admin',
                'description' => 'Full system access; can manage every resource including admins.',
                'is_system' => true,
                'permissions' => '*',
            ],
            [
                'name' => Role::ADMIN,
                'label' => 'Admin',
                'description' => 'Manages tournaments, courts, teams, and users.',
                'is_system' => true,
                'permissions' => [
                    'users.view', 'users.create', 'users.edit', 'users.delete',
                    'roles.view', 'roles.create', 'roles.edit',
                    'teams.view', 'teams.create', 'teams.edit', 'teams.delete',
                    'heis.view', 'heis.create', 'heis.edit', 'heis.delete',
                    'tournaments.view', 'tournaments.create', 'tournaments.edit', 'tournaments.delete', 'tournaments.manage',
                    'categories.create', 'categories.edit', 'categories.delete',
                    'scoring.view', 'scoring.manage',
                    'dashboard.view',
                ],
            ],
            [
                'name' => Role::COURT_OWNER,
                'label' => 'Court Owner',
                'description' => 'Hosts tournaments at their own venue; manages their own events end-to-end.',
                'is_system' => true,
                'permissions' => [
                    'tournaments.view', 'tournaments.create', 'tournaments.edit', 'tournaments.delete', 'tournaments.manage',
                    'categories.create', 'categories.edit', 'categories.delete',
                    'scoring.view', 'scoring.manage',
                    'dashboard.view',
                ],
            ],
            [
                'name' => Role::UMPIRE,
                'label' => 'Umpire',
                'description' => 'Officiates matches and records scores.',
                'is_system' => true,
                'permissions' => ['dashboard.view'],
            ],
            [
                'name' => Role::PLAYER,
                'label' => 'Player',
                'description' => 'Competes in tournaments as part of a team.',
                'is_system' => true,
                'permissions' => ['dashboard.view'],
            ],
        ];

        foreach ($roles as $payload) {
            $permissions = $payload['permissions'];
            unset($payload['permissions']);

            $role = Role::updateOrCreate(['name' => $payload['name']], $payload);

            $names = $permissions === '*'
                ? Permission::query()->pluck('name')->all()
                : $permissions;

            $role->syncPermissions($names);
        }
    }
}
