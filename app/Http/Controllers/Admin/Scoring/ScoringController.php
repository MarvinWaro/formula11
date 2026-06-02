<?php

namespace App\Http\Controllers\Admin\Scoring;

use App\Http\Controllers\Controller;
use App\Models\MatchGame;
use App\Models\Pool;
use App\Models\Role;
use App\Models\Tournament;
use App\Models\TournamentCategory;
use App\Models\TournamentTeam;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class ScoringController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->hasPermission('scoring.view'), 403);

        $user = $request->user();

        $tournaments = Tournament::query()
            ->with(['categories'])
            ->withCount(['categories'])
            ->when(
                $user->hasRole(Role::COURT_OWNER) && ! $user->isAdmin(),
                fn ($query) => $query->where('created_by', $user->id),
            )
            ->latest()
            ->get();

        return Inertia::render('scoring/index', [
            'tournaments' => $tournaments->map(fn (Tournament $t) => [
                'id' => $t->id,
                'name' => $t->name,
                'slug' => $t->slug,
                'status_label' => $t->status->label(),
                'status' => $t->status->value,
                'categories_count' => $t->categories_count,
                'categories' => $t->categories->map(fn (TournamentCategory $c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'slug' => $c->slug,
                ]),
            ]),
            'permissions' => [
                'canManage' => $user->hasPermission('scoring.manage'),
            ],
        ]);
    }

    public function show(
        Request $request,
        Tournament $tournament,
        TournamentCategory $category,
    ): Response {
        abort_unless($request->user()?->hasPermission('scoring.view'), 403);
        abort_if($category->tournament_id !== $tournament->id, 404);

        $category->load([
            'pools.teams' => fn ($q) => $q->orderBy('pool_seed'),
            'pools.matches.teamA',
            'pools.matches.teamB',
            'teams' => fn ($q) => $q->where('status', TournamentTeam::STATUS_ACTIVE),
        ]);

        $unassignedTeams = $category->teams
            ->filter(fn (TournamentTeam $t) => $t->pool_id === null)
            ->values();

        return Inertia::render('scoring/show', [
            'tournament' => [
                'id' => $tournament->id,
                'name' => $tournament->name,
                'slug' => $tournament->slug,
            ],
            'category' => [
                'id' => $category->id,
                'name' => $category->name,
                'division_label' => $category->division->label(),
                'skill_level_label' => $category->skill_level->label(),
                'format' => $category->format->value,
                'format_label' => $category->format->label(),
                'rr_points_to_win' => $category->rr_points_to_win,
                'elim_points_to_win' => $category->elim_points_to_win,
            ],
            'pools' => $category->pools->map(fn (Pool $pool) => $this->serializePool($pool)),
            'unassignedTeams' => $unassignedTeams->map(fn (TournamentTeam $t) => $this->serializeTeam($t)),
            'permissions' => [
                'canManage' => $request->user()->hasPermission('scoring.manage'),
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializePool(Pool $pool): array
    {
        $teams = $pool->teams;
        $matches = $pool->matches;

        $standings = $this->computeStandings($teams, $matches);

        return [
            'id' => $pool->id,
            'name' => $pool->name,
            'teams' => $teams->map(fn (TournamentTeam $t) => $this->serializeTeam($t))->values(),
            'matches' => $matches->map(fn (MatchGame $m) => $this->serializeMatch($m))->values(),
            'standings' => $standings,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeTeam(TournamentTeam $team): array
    {
        return [
            'id' => $team->id,
            'display_name' => $team->display_name,
            'pool_seed' => $team->pool_seed,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeMatch(MatchGame $match): array
    {
        return [
            'id' => $match->id,
            'sequence' => $match->sequence,
            'stage' => $match->stage,
            'team_a' => $match->teamA ? [
                'id' => $match->teamA->id,
                'display_name' => $match->teamA->display_name,
            ] : null,
            'team_b' => $match->teamB ? [
                'id' => $match->teamB->id,
                'display_name' => $match->teamB->display_name,
            ] : null,
            'score_a' => $match->score_a,
            'score_b' => $match->score_b,
            'winner_team_id' => $match->winner_team_id,
            'played_at' => $match->played_at?->toIso8601String(),
        ];
    }

    /**
     * @param  Collection<int, TournamentTeam>  $teams
     * @param  Collection<int, MatchGame>  $matches
     * @return array<int, array<string, mixed>>
     */
    private function computeStandings($teams, $matches): array
    {
        $stats = [];

        foreach ($teams as $team) {
            $stats[$team->id] = [
                'team_id' => $team->id,
                'display_name' => $team->display_name,
                'wins' => 0,
                'losses' => 0,
                'points_for' => 0,
                'points_against' => 0,
                'point_diff' => 0,
                'played' => 0,
            ];
        }

        foreach ($matches as $match) {
            if (! $match->isComplete()) {
                continue;
            }

            if (! isset($stats[$match->team_a_id]) || ! isset($stats[$match->team_b_id])) {
                continue;
            }

            $stats[$match->team_a_id]['points_for'] += $match->score_a;
            $stats[$match->team_a_id]['points_against'] += $match->score_b;
            $stats[$match->team_a_id]['played']++;

            $stats[$match->team_b_id]['points_for'] += $match->score_b;
            $stats[$match->team_b_id]['points_against'] += $match->score_a;
            $stats[$match->team_b_id]['played']++;

            if ($match->winner_team_id === $match->team_a_id) {
                $stats[$match->team_a_id]['wins']++;
                $stats[$match->team_b_id]['losses']++;
            } else {
                $stats[$match->team_b_id]['wins']++;
                $stats[$match->team_a_id]['losses']++;
            }
        }

        foreach ($stats as &$row) {
            $row['point_diff'] = $row['points_for'] - $row['points_against'];
        }
        unset($row);

        usort($stats, function (array $a, array $b) {
            return [$b['wins'], $b['point_diff'], $b['points_for']]
                <=> [$a['wins'], $a['point_diff'], $a['points_for']];
        });

        foreach ($stats as $index => &$row) {
            $row['rank'] = $index + 1;
        }
        unset($row);

        return array_values($stats);
    }
}
