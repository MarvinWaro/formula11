<?php

namespace App\Actions\Tournaments;

use App\Enums\TournamentStatus;
use App\Models\Role;
use App\Models\Tournament;
use App\Models\TournamentCategory;
use App\Models\TournamentTeam;
use App\Models\User;
use Illuminate\Auth\AuthManager;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class RegisterTeam
{
    public function __construct(protected AuthManager $auth) {}

    /**
     * Register a new team from the public registration page.
     *
     * @param  array{
     *     category_id: int,
     *     hei_id?: int|null,
     *     captain_name: string,
     *     captain_email: string,
     *     captain_phone?: string|null,
     *     captain_password?: string|null,
     *     partner_name: string,
     * }  $payload
     */
    public function handle(Tournament $tournament, array $payload, ?User $authenticatedUser = null): TournamentTeam
    {
        return DB::transaction(function () use ($tournament, $payload, $authenticatedUser) {
            $this->guardTournamentOpen($tournament);

            $category = $this->resolveCategory($tournament, $payload['category_id']);

            $this->guardCategoryHasCapacity($category);

            $captain = $authenticatedUser
                ?? $this->resolveCaptain($payload);

            $team = TournamentTeam::create([
                'tournament_category_id' => $category->id,
                'hei_id' => $payload['hei_id'] ?? null,
                'display_name' => trim($payload['captain_name']).' & '.trim($payload['partner_name']),
                'captain_email' => $payload['captain_email'],
                'captain_phone' => $payload['captain_phone'] ?? null,
                'status' => TournamentTeam::STATUS_ACTIVE,
            ]);

            $team->players()->create([
                'user_id' => $captain->id,
                'display_name' => $captain->name,
                'is_captain' => true,
            ]);

            $team->players()->create([
                'user_id' => null,
                'display_name' => trim($payload['partner_name']),
                'is_captain' => false,
            ]);

            if (! $authenticatedUser) {
                $this->auth->guard()->login($captain);
            }

            return $team;
        });
    }

    protected function guardTournamentOpen(Tournament $tournament): void
    {
        if ($tournament->status !== TournamentStatus::RegistrationOpen) {
            throw ValidationException::withMessages([
                'tournament' => __('Registration is not currently open for this tournament.'),
            ]);
        }
    }

    protected function resolveCategory(Tournament $tournament, int $categoryId): TournamentCategory
    {
        $category = $tournament->categories()->whereKey($categoryId)->first();

        if ($category === null) {
            throw ValidationException::withMessages([
                'category_id' => __('The selected category does not belong to this tournament.'),
            ]);
        }

        return $category;
    }

    protected function guardCategoryHasCapacity(TournamentCategory $category): void
    {
        if ($category->max_teams === null) {
            return;
        }

        $registered = $category->teams()->where('status', TournamentTeam::STATUS_ACTIVE)->count();

        if ($registered >= $category->max_teams) {
            throw ValidationException::withMessages([
                'category_id' => __('This category has reached its team cap.'),
            ]);
        }
    }

    /**
     * Find or create a captain User, assigning the player role on creation.
     *
     * @param  array<string, mixed>  $payload
     */
    protected function resolveCaptain(array $payload): User
    {
        $existing = User::query()->where('email', $payload['captain_email'])->first();

        if ($existing) {
            throw ValidationException::withMessages([
                'captain_email' => __('An account already exists with this email. Please sign in first and try again.'),
            ]);
        }

        $user = User::create([
            'name' => trim($payload['captain_name']),
            'email' => $payload['captain_email'],
            'password' => Hash::make($payload['captain_password'] ?? Str::random(40)),
        ]);

        $user->assignRole(Role::PLAYER);

        return $user;
    }
}
