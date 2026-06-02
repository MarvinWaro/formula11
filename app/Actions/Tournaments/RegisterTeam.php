<?php

namespace App\Actions\Tournaments;

use App\Actions\Teams\CreateTeam;
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
    public function __construct(
        protected AuthManager $auth,
        private CreateTeam $createTeam,
    ) {}

    /**
     * Register a new team from the public registration page.
     *
     * @param  array{
     *     category_id: string,
     *     hei_id?: string|null,
     *     registration_mode: string,
     *     captain_name: string,
     *     captain_email: string,
     *     captain_phone?: string|null,
     *     captain_password?: string|null,
     *     partner_name?: string|null,
     *     partner_email?: string|null,
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

            $isPair = ($payload['registration_mode'] ?? 'pair') === 'pair';
            $partnerName = $isPair ? trim($payload['partner_name'] ?? 'Partner') : null;

            $team = TournamentTeam::create([
                'tournament_category_id' => $category->id,
                'hei_id' => $payload['hei_id'] ?? null,
                'display_name' => $isPair
                    ? $captain->name.' & '.$partnerName
                    : $captain->name.' & TBD',
                'captain_email' => $captain->email,
                'captain_phone' => $payload['captain_phone'] ?? null,
                'partner_email' => $payload['partner_email'] ?? null,
                // Always generate a token so the partner can claim their slot
                // later, regardless of whether they were filled in upfront.
                'partner_token' => (string) Str::ulid(),
                'status' => TournamentTeam::STATUS_ACTIVE,
            ]);

            $team->players()->create([
                'user_id' => $captain->id,
                'display_name' => $captain->name,
                'is_captain' => true,
            ]);

            if ($isPair) {
                $team->players()->create([
                    'user_id' => null,
                    'display_name' => $partnerName,
                    'is_captain' => false,
                ]);
            }

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

        if ($tournament->registration_deadline !== null && $tournament->registration_deadline->isPast()) {
            throw ValidationException::withMessages([
                'tournament' => __('Registration closed on :date.', [
                    'date' => $tournament->registration_deadline->format('M j, Y g:i A'),
                ]),
            ]);
        }
    }

    protected function resolveCategory(Tournament $tournament, string $categoryId): TournamentCategory
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
            // Existing account: prompt for the password and authenticate inline.
            if (empty($payload['captain_password'])) {
                throw ValidationException::withMessages([
                    'needs_signin' => 'true',
                ]);
            }

            if (! Hash::check($payload['captain_password'], $existing->password)) {
                throw ValidationException::withMessages([
                    'captain_password' => __('That password is incorrect. Try again or reset it.'),
                ]);
            }

            return $existing;
        }

        // New email: prompt to create a password, then create the account.
        if (empty($payload['captain_password'])) {
            throw ValidationException::withMessages([
                'needs_password' => 'true',
            ]);
        }

        $user = User::create([
            'name' => trim($payload['captain_name']),
            'email' => $payload['captain_email'],
            'password' => Hash::make($payload['captain_password']),
        ]);

        $this->createTeam->handle($user, $user->name."'s Team", isPersonal: true);
        $user->assignRole(Role::PLAYER);

        return $user;
    }
}
