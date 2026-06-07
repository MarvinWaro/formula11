<?php

use App\Enums\TournamentStatus;
use App\Models\MatchGame;
use App\Models\Pool;
use App\Models\Role;
use App\Models\Tournament;
use App\Models\TournamentTeam;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(PermissionSeeder::class);
    $this->seed(RoleSeeder::class);
});

function tournamentWithPoolMatches(): array
{
    $tournament = Tournament::create(['name' => 'Standings Cup '.uniqid()]);
    $category = $tournament->categories()->create([
        'name' => 'Beginner Mens',
        'division' => 'mens',
        'skill_level' => 'beginner',
        'rr_points_to_win' => 11,
        'elim_points_to_win' => 15,
        'win_by_two' => true,
        'bracket_size' => 4,
        'teams_advancing_per_bracket' => 2,
    ]);
    $tournament->update(['status' => TournamentStatus::RegistrationOpen]);

    $pool = Pool::create([
        'tournament_category_id' => $category->id,
        'name' => 'Pool A',
        'display_order' => 1,
    ]);

    $teams = collect(['Alpha', 'Bravo', 'Charlie'])->map(fn ($name) => TournamentTeam::create([
        'tournament_category_id' => $category->id,
        'pool_id' => $pool->id,
        'display_name' => $name,
        'captain_email' => strtolower($name).'@example.com',
        'status' => TournamentTeam::STATUS_ACTIVE,
    ]));

    MatchGame::create([
        'tournament_category_id' => $category->id,
        'pool_id' => $pool->id,
        'stage' => MatchGame::STAGE_POOL,
        'sequence' => 1,
        'team_a_id' => $teams[0]->id,
        'team_b_id' => $teams[1]->id,
        'score_a' => 11,
        'score_b' => 5,
        'winner_team_id' => $teams[0]->id,
        'played_at' => now(),
    ]);
    MatchGame::create([
        'tournament_category_id' => $category->id,
        'pool_id' => $pool->id,
        'stage' => MatchGame::STAGE_POOL,
        'sequence' => 2,
        'team_a_id' => $teams[0]->id,
        'team_b_id' => $teams[2]->id,
        'score_a' => 11,
        'score_b' => 7,
        'winner_team_id' => $teams[0]->id,
        'played_at' => now(),
    ]);
    MatchGame::create([
        'tournament_category_id' => $category->id,
        'pool_id' => $pool->id,
        'stage' => MatchGame::STAGE_POOL,
        'sequence' => 3,
        'team_a_id' => $teams[1]->id,
        'team_b_id' => $teams[2]->id,
        'score_a' => 11,
        'score_b' => 9,
        'winner_team_id' => $teams[1]->id,
        'played_at' => now(),
    ]);

    return compact('tournament', 'category', 'pool', 'teams');
}

test('unauthenticated users are redirected to login', function () {
    ['tournament' => $tournament, 'category' => $category] = tournamentWithPoolMatches();

    $this->get(route('standings.show', [
        'tournament' => $tournament->slug,
        'category' => $category->slug,
    ]))->assertRedirect(route('login'));
});

test('any authenticated player can view standings regardless of registration', function () {
    ['tournament' => $tournament, 'category' => $category] = tournamentWithPoolMatches();
    $stranger = User::factory()->create();
    $stranger->assignRole(Role::PLAYER);

    $response = $this->actingAs($stranger)->get(route('standings.show', [
        'tournament' => $tournament->slug,
        'category' => $category->slug,
    ]));

    $response->assertOk();
    $response->assertInertia(fn ($p) => $p
        ->component('standings/show')
        ->where('category.slug', $category->slug)
        ->has('pools', 1)
        ->where('pools.0.standings.0.display_name', 'Alpha')
        ->where('pools.0.standings.0.wins', 2)
        ->where('pools.0.standings.0.rank', 1)
        ->where('pools.0.standings.1.display_name', 'Bravo')
        ->where('pools.0.standings.2.display_name', 'Charlie')
        ->where('bracket', null),
    );
});

test('mismatched tournament and category combination returns 404', function () {
    ['tournament' => $tournament] = tournamentWithPoolMatches();

    // Give the other tournament's category a unique slug so route binding
    // returns it, then the controller's tournament_id guard fires.
    $otherTournament = Tournament::create(['name' => 'Other Cup '.uniqid()]);
    $otherCategory = $otherTournament->categories()->create([
        'name' => 'Advanced Womens '.uniqid(),
        'division' => 'womens',
        'skill_level' => 'intermediate',
        'rr_points_to_win' => 11,
        'elim_points_to_win' => 15,
        'win_by_two' => true,
        'bracket_size' => 4,
        'teams_advancing_per_bracket' => 1,
    ]);

    $user = User::factory()->create();
    $user->assignRole(Role::PLAYER);

    $this->actingAs($user)->get(route('standings.show', [
        'tournament' => $tournament->slug,
        'category' => $otherCategory->slug,
    ]))->assertNotFound();
});

test('bracket payload groups non-pool matches by stage', function () {
    ['tournament' => $tournament, 'category' => $category, 'teams' => $teams] = tournamentWithPoolMatches();

    MatchGame::create([
        'tournament_category_id' => $category->id,
        'stage' => MatchGame::STAGE_SEMI,
        'sequence' => 1,
        'team_a_id' => $teams[0]->id,
        'team_b_id' => $teams[1]->id,
    ]);
    MatchGame::create([
        'tournament_category_id' => $category->id,
        'stage' => MatchGame::STAGE_BRONZE,
        'sequence' => 1,
        'team_a_id' => $teams[1]->id,
        'team_b_id' => $teams[2]->id,
    ]);
    MatchGame::create([
        'tournament_category_id' => $category->id,
        'stage' => MatchGame::STAGE_FINAL,
        'sequence' => 1,
        'team_a_id' => $teams[0]->id,
        'team_b_id' => $teams[2]->id,
    ]);

    $user = User::factory()->create();
    $user->assignRole(Role::PLAYER);

    $response = $this->actingAs($user)->get(route('standings.show', [
        'tournament' => $tournament->slug,
        'category' => $category->slug,
    ]));

    $response->assertOk();
    $response->assertInertia(fn ($p) => $p
        ->where('bracket.semis.0.stage', MatchGame::STAGE_SEMI)
        ->where('bracket.bronze.stage', MatchGame::STAGE_BRONZE)
        ->where('bracket.final.stage', MatchGame::STAGE_FINAL),
    );
});

test('index lists the tournament categories', function () {
    ['tournament' => $tournament] = tournamentWithPoolMatches();
    $user = User::factory()->create();
    $user->assignRole(Role::PLAYER);

    $response = $this->actingAs($user)->get(route('standings.index', [
        'tournament' => $tournament->slug,
    ]));

    $response->assertOk();
    $response->assertInertia(fn ($p) => $p
        ->component('standings/index')
        ->where('tournament.slug', $tournament->slug)
        ->has('categories', 1)
        ->where('categories.0.rules_label', 'Pool race to 11 · Bracket race to 15 · Win by 2'),
    );
});
