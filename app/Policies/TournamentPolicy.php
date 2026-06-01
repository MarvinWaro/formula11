<?php

namespace App\Policies;

use App\Models\Role;
use App\Models\Tournament;
use App\Models\User;

class TournamentPolicy
{
    /**
     * Admins always pass; other rules apply individually.
     */
    public function before(User $user, string $ability): ?bool
    {
        return $user->isAdmin() ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return $user->hasPermission('tournaments.view');
    }

    public function view(User $user, Tournament $tournament): bool
    {
        return $this->owns($user, $tournament);
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('tournaments.create');
    }

    public function update(User $user, Tournament $tournament): bool
    {
        return $user->hasPermission('tournaments.edit') && $this->owns($user, $tournament);
    }

    public function delete(User $user, Tournament $tournament): bool
    {
        return $user->hasPermission('tournaments.delete') && $this->owns($user, $tournament);
    }

    public function manage(User $user, Tournament $tournament): bool
    {
        return $user->hasPermission('tournaments.manage') && $this->owns($user, $tournament);
    }

    /**
     * Court owners only see and act on tournaments they created.
     */
    protected function owns(User $user, Tournament $tournament): bool
    {
        if ($user->hasRole(Role::COURT_OWNER)) {
            return $tournament->created_by === $user->id;
        }

        return $user->hasPermission('tournaments.view');
    }
}
