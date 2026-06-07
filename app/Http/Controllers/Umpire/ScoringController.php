<?php

namespace App\Http\Controllers\Umpire;

use App\Actions\Scoring\UpdateMatchScore;
use App\Http\Controllers\Controller;
use App\Http\Requests\Umpire\FinalizeScoreRequest;
use App\Http\Requests\Umpire\UpdateScoreRequest;
use App\Models\MatchGame;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScoringController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorizeUmpire($request);

        $matches = MatchGame::query()
            ->whereNotNull('team_a_id')
            ->whereNotNull('team_b_id')
            ->whereNull('played_at')
            ->with([
                'teamA:id,display_name',
                'teamB:id,display_name',
                'pool:id,name',
                'category:id,name,tournament_id',
                'category.tournament:id,name,slug',
                'assignedUmpire:id,name',
            ])
            ->orderBy('updated_at', 'desc')
            ->get();

        $grouped = $matches
            ->groupBy(fn (MatchGame $m) => $m->category->tournament->id)
            ->map(function ($tournamentMatches) {
                $first = $tournamentMatches->first();

                return [
                    'tournament' => [
                        'id' => $first->category->tournament->id,
                        'name' => $first->category->tournament->name,
                        'slug' => $first->category->tournament->slug,
                    ],
                    'matches' => $tournamentMatches->map(fn (MatchGame $m) => [
                        'id' => $m->id,
                        'stage' => $m->stage,
                        'sequence' => $m->sequence,
                        'court_number' => $m->court_number,
                        'assigned_umpire' => $m->assignedUmpire ? [
                            'id' => $m->assignedUmpire->id,
                            'name' => $m->assignedUmpire->name,
                        ] : null,
                        'score_a' => $m->score_a,
                        'score_b' => $m->score_b,
                        'category_name' => $m->category->name,
                        'pool_name' => $m->pool?->name,
                        'team_a' => $m->teamA?->display_name,
                        'team_b' => $m->teamB?->display_name,
                        'in_progress' => $m->score_a !== null || $m->score_b !== null,
                    ])->values(),
                ];
            })
            ->values();

        return Inertia::render('umpire/index', [
            'groups' => $grouped,
            'currentUserId' => $request->user()->id,
        ]);
    }

    public function show(Request $request, MatchGame $match): Response
    {
        $this->authorizeUmpire($request);

        $match->load(['teamA', 'teamB', 'category.tournament', 'pool', 'scoredBy']);

        if ($match->team_a_id === null || $match->team_b_id === null) {
            abort(404);
        }

        $category = $match->category;
        $target = $match->stage === MatchGame::STAGE_POOL
            ? (int) $category->rr_points_to_win
            : (int) $category->elim_points_to_win;

        return Inertia::render('umpire/match', [
            'match' => [
                'id' => $match->id,
                'stage' => $match->stage,
                'sequence' => $match->sequence,
                'court_number' => $match->court_number,
                'score_a' => $match->score_a,
                'score_b' => $match->score_b,
                'winner_team_id' => $match->winner_team_id,
                'played_at' => $match->played_at?->toIso8601String(),
                'scored_at' => $match->scored_at?->toIso8601String(),
                'scored_by' => $match->scoredBy ? [
                    'id' => $match->scoredBy->id,
                    'name' => $match->scoredBy->name,
                ] : null,
                'team_a' => [
                    'id' => $match->teamA->id,
                    'display_name' => $match->teamA->display_name,
                ],
                'team_b' => [
                    'id' => $match->teamB->id,
                    'display_name' => $match->teamB->display_name,
                ],
            ],
            'category' => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'target_points' => $target,
                'win_by_two' => (bool) $category->win_by_two,
                'rules_label' => $category->win_by_two
                    ? "Race to {$target} · Win by 2"
                    : "Race to {$target}",
            ],
            'tournament' => [
                'id' => $category->tournament->id,
                'name' => $category->tournament->name,
                'slug' => $category->tournament->slug,
            ],
            'pool' => $match->pool ? [
                'id' => $match->pool->id,
                'name' => $match->pool->name,
            ] : null,
        ]);
    }

    public function updateScore(
        UpdateScoreRequest $request,
        MatchGame $match,
        UpdateMatchScore $action,
    ): RedirectResponse {
        $data = $request->validated();

        $action->live($match, (int) $data['score_a'], (int) $data['score_b'], $request->user());

        return back();
    }

    public function finalize(
        FinalizeScoreRequest $request,
        MatchGame $match,
        UpdateMatchScore $action,
    ): RedirectResponse {
        $data = $request->validated();

        $action->finalize($match, (int) $data['score_a'], (int) $data['score_b'], $request->user());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Final score recorded.')]);

        return to_route('umpire.index');
    }

    protected function authorizeUmpire(Request $request): void
    {
        abort_unless($request->user()?->hasPermission('scoring.score'), 403);
    }
}
