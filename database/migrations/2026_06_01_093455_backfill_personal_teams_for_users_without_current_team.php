<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::transaction(function () {
            $users = DB::table('users')
                ->whereNull('current_team_id')
                ->whereNull('deleted_at')
                ->orderBy('id')
                ->get(['id', 'name']);

            foreach ($users as $user) {
                $teamId = DB::table('team_members')
                    ->join('teams', 'teams.id', '=', 'team_members.team_id')
                    ->where('team_members.user_id', $user->id)
                    ->where('teams.is_personal', true)
                    ->whereNull('teams.deleted_at')
                    ->orderBy('teams.id')
                    ->value('teams.id');

                if (! $teamId) {
                    $teamId = DB::table('teams')->insertGetId([
                        'name' => $user->name."'s Team",
                        'slug' => $this->uniqueTeamSlug($user->name."'s Team"),
                        'is_personal' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    DB::table('team_members')->insert([
                        'team_id' => $teamId,
                        'user_id' => $user->id,
                        'role' => 'owner',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                DB::table('users')
                    ->where('id', $user->id)
                    ->update([
                        'current_team_id' => $teamId,
                        'updated_at' => now(),
                    ]);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }

    private function uniqueTeamSlug(string $name): string
    {
        $baseSlug = Str::slug($name) ?: 'team';
        $slug = $baseSlug;
        $suffix = 1;

        while (DB::table('teams')->where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
};
