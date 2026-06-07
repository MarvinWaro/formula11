<?php

namespace App\Http\Controllers\Admin\Scoring;

use App\Http\Controllers\Controller;
use App\Models\MatchGame;
use App\Models\Pool;
use App\Models\Role;
use App\Models\Tournament;
use App\Models\TournamentCategory;
use App\Models\TournamentTeam;
use App\Models\User;
use App\Services\Scoring\CategoryStandingsBuilder;
use App\Services\Scoring\StandingsCalculator;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScoringController extends Controller
{
    public function __construct(
        protected StandingsCalculator $standings,
        protected CategoryStandingsBuilder $builder,
    ) {}

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
            'pools.matches.assignedUmpire',
            'matches.teamA',
            'matches.teamB',
            'matches.assignedUmpire',
            'teams' => fn ($q) => $q->where('status', TournamentTeam::STATUS_ACTIVE),
        ]);

        $poolPlay = $this->poolPlayProgress($category);

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
                'slug' => $category->slug,
                'division_label' => $category->division->label(),
                'skill_level_label' => $category->skill_level->label(),
                'format' => $category->format->value,
                'format_label' => $category->format->label(),
                'rr_points_to_win' => $category->rr_points_to_win,
                'elim_points_to_win' => $category->elim_points_to_win,
            ],
            'pools' => $category->pools->map(fn (Pool $pool) => $this->serializePool($pool)),
            'unassignedTeams' => $unassignedTeams->map(fn (TournamentTeam $t) => $this->serializeTeam($t)),
            'bracket' => $this->builder->bracket($category->matches),
            'poolPlay' => $poolPlay,
            'availableUmpires' => $this->availableUmpires(),
            'permissions' => [
                'canManage' => $request->user()->hasPermission('scoring.manage'),
            ],
        ]);
    }

    /**
     * @return array<int, array{id:string, name:string}>
     */
    private function availableUmpires(): array
    {
        return User::query()
            ->whereHas('roles.permissions', fn ($q) => $q->where('name', 'scoring.score'))
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (User $u) => ['id' => $u->id, 'name' => $u->name])
            ->all();
    }

    /**
     * @return array{total:int, finalized:int, complete:bool, has_matches:bool}
     */
    private function poolPlayProgress(TournamentCategory $category): array
    {
        $total = 0;
        $finalized = 0;

        foreach ($category->pools as $pool) {
            foreach ($pool->matches as $match) {
                $total++;
                if ($match->played_at !== null) {
                    $finalized++;
                }
            }
        }

        return [
            'total' => $total,
            'finalized' => $finalized,
            'has_matches' => $total > 0,
            'complete' => $total > 0 && $finalized === $total,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializePool(Pool $pool): array
    {
        $teams = $pool->teams;
        $matches = $pool->matches;

        $standings = $this->standings->handle($teams, $matches);

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
            'court_number' => $match->court_number,
            'assigned_umpire' => $match->assignedUmpire ? [
                'id' => $match->assignedUmpire->id,
                'name' => $match->assignedUmpire->name,
            ] : null,
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
}
