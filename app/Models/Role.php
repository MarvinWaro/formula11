<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['name', 'label', 'description', 'is_system'])]
class Role extends Model
{
    public const UMPIRE = 'umpire';

    public const PLAYER = 'player';

    public const COURT_OWNER = 'court_owner';

    public const ADMIN = 'admin';

    public const SUPER_ADMIN = 'super_admin';

    /**
     * Get all users assigned to this role.
     *
     * @return BelongsToMany<User, $this>
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withTimestamps();
    }

    /**
     * Get all permissions granted to this role.
     *
     * @return BelongsToMany<Permission, $this>
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class)->withTimestamps();
    }

    /**
     * Determine if the role has the given permission name.
     */
    public function hasPermission(string $permission): bool
    {
        return $this->permissions()->where('name', $permission)->exists();
    }

    /**
     * Replace the role's permissions with the given names.
     *
     * @param  array<int, string>  $permissions
     */
    public function syncPermissions(array $permissions): void
    {
        $ids = Permission::query()->whereIn('name', $permissions)->pluck('id')->all();

        $this->permissions()->sync($ids);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_system' => 'boolean',
        ];
    }
}
