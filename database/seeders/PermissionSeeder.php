<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach ($this->permissions() as $permission) {
            Permission::updateOrCreate(['name' => $permission['name']], $permission);
        }
    }

    /**
     * The full catalog of system permissions, grouped for the UI.
     *
     * @return array<int, array{name: string, label: string, group: string, description: string}>
     */
    public static function permissions(): array
    {
        return [
            // User Management
            ['name' => 'users.view', 'label' => 'View Users', 'group' => 'User Management', 'description' => 'See the list of users in the system.'],
            ['name' => 'users.create', 'label' => 'Create User', 'group' => 'User Management', 'description' => 'Add new users.'],
            ['name' => 'users.edit', 'label' => 'Edit User', 'group' => 'User Management', 'description' => 'Update a user\'s name, email, or assigned roles.'],
            ['name' => 'users.delete', 'label' => 'Delete User', 'group' => 'User Management', 'description' => 'Remove a user from the system.'],

            // Roles & Permissions
            ['name' => 'roles.view', 'label' => 'View Roles', 'group' => 'Roles & Permissions', 'description' => 'See the list of roles and their permissions.'],
            ['name' => 'roles.create', 'label' => 'Create Role', 'group' => 'Roles & Permissions', 'description' => 'Define new roles with permission sets.'],
            ['name' => 'roles.edit', 'label' => 'Edit Role', 'group' => 'Roles & Permissions', 'description' => 'Rename a role or change its permissions.'],
            ['name' => 'roles.delete', 'label' => 'Delete Role', 'group' => 'Roles & Permissions', 'description' => 'Remove a non-system role.'],

            // Teams (workspace)
            ['name' => 'teams.view', 'label' => 'View Teams', 'group' => 'Teams', 'description' => 'See teams the user does not belong to.'],
            ['name' => 'teams.create', 'label' => 'Create Team', 'group' => 'Teams', 'description' => 'Create new workspace teams.'],
            ['name' => 'teams.edit', 'label' => 'Edit Team', 'group' => 'Teams', 'description' => 'Update any team\'s details.'],
            ['name' => 'teams.delete', 'label' => 'Delete Team', 'group' => 'Teams', 'description' => 'Delete any non-personal team.'],

            // Higher Education Institutions
            ['name' => 'heis.view', 'label' => 'View HEIs', 'group' => 'HEIs', 'description' => 'See the list of Higher Education Institutions.'],
            ['name' => 'heis.create', 'label' => 'Create HEI', 'group' => 'HEIs', 'description' => 'Add a new institution to the registry.'],
            ['name' => 'heis.edit', 'label' => 'Edit HEI', 'group' => 'HEIs', 'description' => 'Update an institution\'s details.'],
            ['name' => 'heis.delete', 'label' => 'Delete HEI', 'group' => 'HEIs', 'description' => 'Remove an institution from the registry.'],

            // Tournaments
            ['name' => 'tournaments.view', 'label' => 'View Tournaments', 'group' => 'Tournaments', 'description' => 'See the list of tournaments.'],
            ['name' => 'tournaments.create', 'label' => 'Create Tournament', 'group' => 'Tournaments', 'description' => 'Create a new tournament.'],
            ['name' => 'tournaments.edit', 'label' => 'Edit Tournament', 'group' => 'Tournaments', 'description' => 'Update tournament details.'],
            ['name' => 'tournaments.delete', 'label' => 'Delete Tournament', 'group' => 'Tournaments', 'description' => 'Soft-delete a tournament.'],
            ['name' => 'tournaments.manage', 'label' => 'Manage Tournament Lifecycle', 'group' => 'Tournaments', 'description' => 'Open / close registration, finalize brackets, advance status.'],

            // Categories (per tournament)
            ['name' => 'categories.create', 'label' => 'Create Category', 'group' => 'Tournaments', 'description' => 'Add a category to a tournament.'],
            ['name' => 'categories.edit', 'label' => 'Edit Category', 'group' => 'Tournaments', 'description' => 'Update category rules.'],
            ['name' => 'categories.delete', 'label' => 'Delete Category', 'group' => 'Tournaments', 'description' => 'Remove a category from a tournament.'],

            // Scoring (pools, matches)
            ['name' => 'scoring.view', 'label' => 'View Scoring', 'group' => 'Scoring', 'description' => 'See pools, matches, and standings for a tournament category.'],
            ['name' => 'scoring.manage', 'label' => 'Manage Scoring', 'group' => 'Scoring', 'description' => 'Create pools, assign teams, generate matches, and record scores.'],
            ['name' => 'scoring.score', 'label' => 'Score Matches', 'group' => 'Scoring', 'description' => 'Record live match scores from the umpire interface.'],

            // Dashboard / general
            ['name' => 'dashboard.view', 'label' => 'View Dashboard', 'group' => 'General', 'description' => 'Access the main dashboard.'],
        ];
    }
}
