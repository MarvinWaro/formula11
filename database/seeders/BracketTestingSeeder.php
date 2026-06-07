<?php

namespace Database\Seeders;

use App\Actions\Teams\CreateTeam;
use App\Enums\TournamentStatus;
use App\Models\Role;
use App\Models\Tournament;
use App\Models\TournamentCategory;
use App\Models\TournamentTeam;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class BracketTestingSeeder extends Seeder
{
    private const TOURNAMENT_NAME = 'Bracket Test Cup';

    private const CATEGORY_NAME = 'Test Beginner Mens';

    private const TEAM_COUNT = 32;

    private const PASSWORD = '12345678';

    private const OWNER_EMAIL = 'paraiso@gmail.com';

    public function run(): void
    {
        $createTeam = app(CreateTeam::class);

        $tournament = $this->ensureTournament();
        $category = $this->ensureCategory($tournament);

        $registeredCount = TournamentTeam::query()
            ->where('tournament_category_id', $category->id)
            ->where('status', TournamentTeam::STATUS_ACTIVE)
            ->count();

        $teamsNeeded = self::TEAM_COUNT - $registeredCount;

        if ($teamsNeeded <= 0) {
            $this->command?->info("Category already has {$registeredCount} teams — nothing to seed.");

            return;
        }

        $this->command?->info("Seeding {$teamsNeeded} doubles teams (".($teamsNeeded * 2).' players)…');

        $startIndex = $registeredCount * 2 + 1;

        for ($i = 0; $i < $teamsNeeded; $i++) {
            $captainIndex = $startIndex + ($i * 2);
            $partnerIndex = $captainIndex + 1;

            $captain = $this->ensurePlayer($captainIndex, $createTeam);
            $partner = $this->ensurePlayer($partnerIndex, $createTeam);

            $team = TournamentTeam::create([
                'tournament_category_id' => $category->id,
                'display_name' => $captain->name.' & '.$partner->name,
                'captain_email' => $captain->email,
                'captain_phone' => '09'.str_pad((string) random_int(0, 999999999), 9, '0', STR_PAD_LEFT),
                'partner_email' => $partner->email,
                'partner_token' => (string) Str::ulid(),
                'status' => TournamentTeam::STATUS_ACTIVE,
            ]);

            $team->players()->create([
                'user_id' => $captain->id,
                'display_name' => $captain->name,
                'is_captain' => true,
            ]);

            $team->players()->create([
                'user_id' => $partner->id,
                'display_name' => $partner->name,
                'is_captain' => false,
            ]);
        }

        $this->command?->info("Done. Login with any bracket-player-NN@test.local / password '".self::PASSWORD."'.");
        $this->command?->info("Tournament slug: {$tournament->slug}");
    }

    private function ensureTournament(): Tournament
    {
        $owner = User::query()->where('email', self::OWNER_EMAIL)->first();

        if ($owner === null) {
            $this->command?->warn(
                'Court owner '.self::OWNER_EMAIL.' not found — run PlayerSeeder first. Tournament will be created without an owner.',
            );
        }

        $tournament = Tournament::query()
            ->where('name', self::TOURNAMENT_NAME)
            ->first();

        if ($tournament !== null) {
            $updates = [];

            if ($tournament->status !== TournamentStatus::RegistrationOpen) {
                $updates['status'] = TournamentStatus::RegistrationOpen;
            }

            if ($owner !== null && $tournament->created_by !== $owner->id) {
                $updates['created_by'] = $owner->id;
                $updates['organizer_name'] = $owner->name;
            }

            if ($updates !== []) {
                $tournament->update($updates);
            }

            return $tournament->fresh();
        }

        $tournament = Tournament::create([
            'name' => self::TOURNAMENT_NAME,
            'organizer_name' => $owner?->name ?? 'Bracket QA',
            'venue' => 'Test Court',
            'description' => 'Auto-seeded tournament for bracket / scoring testing.',
            'registration_fee' => 0,
            'starts_at' => now()->addDays(7),
            'ends_at' => now()->addDays(9),
            'registration_deadline' => now()->addDays(6),
            'created_by' => $owner?->id,
        ]);

        $tournament->update(['status' => TournamentStatus::RegistrationOpen]);

        return $tournament->fresh();
    }

    private function ensureCategory(Tournament $tournament): TournamentCategory
    {
        $existing = $tournament->categories()->where('name', self::CATEGORY_NAME)->first();

        if ($existing !== null) {
            return $existing;
        }

        return $tournament->categories()->create([
            'name' => self::CATEGORY_NAME,
            'division' => 'mens',
            'skill_level' => 'beginner',
            'format' => 'round_robin_elimination',
            'rr_points_to_win' => 11,
            'elim_points_to_win' => 15,
            'win_by_two' => true,
            'bracket_size' => 4,
            'teams_advancing_per_bracket' => 1,
            'max_teams' => self::TEAM_COUNT,
            'registration_fee' => 0,
        ]);
    }

    private function ensurePlayer(int $index, CreateTeam $createTeam): User
    {
        $padded = str_pad((string) $index, 2, '0', STR_PAD_LEFT);
        $email = "bracket-player-{$padded}@test.local";

        $existing = User::query()->where('email', $email)->first();

        if ($existing !== null) {
            if (! $existing->hasRole(Role::PLAYER)) {
                $existing->assignRole(Role::PLAYER);
            }

            return $existing;
        }

        $user = User::factory()->create([
            'name' => "Bracket Player {$padded}",
            'email' => $email,
            'password' => Hash::make(self::PASSWORD),
        ]);

        $createTeam->handle($user, $user->name."'s Team", isPersonal: true);
        $user->assignRole(Role::PLAYER);

        return $user;
    }
}
