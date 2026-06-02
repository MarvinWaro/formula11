<?php

namespace App\Concerns;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Collection;

trait HasRoles
{
    /**
     * Get all roles assigned to the user.
     *
     * @return BelongsToMany<Role, $this>
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class)->withTimestamps();
    }

    /**
     * Determine if the user has the given role.
     */
    public function hasRole(string $role): bool
    {
        return $this->roles()->where('name', $role)->exists();
    }

    /**
     * Determine if the user has any of the given roles.
     *
     * @param  array<int, string>  $roles
     */
    public function hasAnyRole(array $roles): bool
    {
        return $this->roles()->whereIn('name', $roles)->exists();
    }

    /**
     * Assign one or more roles to the user. Existing roles are kept.
     *
     * @param  string|array<int, string>  $roles
     */
    public function assignRole(string|array $roles): void
    {
        $names = is_array($roles) ? $roles : [$roles];

        $ids = Role::query()->whereIn('name', $names)->pluck('id')->all();

        $this->roles()->syncWithoutDetaching($ids);
    }

    /**
     * Replace the user's roles with the given set.
     *
     * @param  array<int, string>  $roles
     */
    public function syncRoles(array $roles): void
    {
        $ids = Role::query()->whereIn('name', $roles)->pluck('id')->all();

        $this->roles()->sync($ids);
    }

    /**
     * Remove the given role from the user.
     */
    public function removeRole(string $role): void
    {
        $id = Role::query()->where('name', $role)->value('id');

        if ($id !== null) {
            $this->roles()->detach($id);
        }
    }

    /**
     * Get the user's role names as a flat collection.
     *
     * @return Collection<int, string>
     */
    public function roleNames(): Collection
    {
        return $this->roles()->pluck('name');
    }

    /**
     * Determine if the user has the given permission through any role.
     */
    public function hasPermission(string $permission): bool
    {
        return $this->roles()
            ->whereHas('permissions', fn ($query) => $query->where('name', $permission))
            ->exists();
    }

    /**
     * Get all permission names granted to the user via their roles.
     *
     * @return Collection<int, string>
     */
    public function permissionNames(): Collection
    {
        return Permission::query()
            ->whereHas('roles', fn ($query) => $query->whereIn(
                'roles.id',
                $this->roles()->pluck('roles.id'),
            ))
            ->pluck('name');
    }

    /**
     * Convenience: check if the user is an admin or super admin.
     */
    public function isAdmin(): bool
    {
        return $this->hasAnyRole([Role::ADMIN, Role::SUPER_ADMIN]);
    }
}
