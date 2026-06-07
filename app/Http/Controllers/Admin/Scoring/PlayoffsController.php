<?php

namespace App\Http\Controllers\Admin\Scoring;

use App\Actions\Scoring\GenerateBracketMatches;
use App\Http\Controllers\Controller;
use App\Models\Tournament;
use App\Models\TournamentCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PlayoffsController extends Controller
{
    public function __construct(protected GenerateBracketMatches $action) {}

    public function preview(
        Request $request,
        Tournament $tournament,
        TournamentCategory $category,
    ): JsonResponse {
        abort_unless($request->user()?->hasPermission('scoring.manage'), 403);
        $this->assertCategoryBelongs($tournament, $category);

        return response()->json($this->action->preview($category));
    }

    public function store(
        Request $request,
        Tournament $tournament,
        TournamentCategory $category,
    ): RedirectResponse {
        abort_unless($request->user()?->hasPermission('scoring.manage'), 403);
        $this->assertCategoryBelongs($tournament, $category);

        $this->action->handle($category);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Playoff bracket generated.')]);

        return back();
    }

    public function destroy(
        Request $request,
        Tournament $tournament,
        TournamentCategory $category,
    ): RedirectResponse {
        abort_unless($request->user()?->hasPermission('scoring.manage'), 403);
        $this->assertCategoryBelongs($tournament, $category);

        $this->action->reset($category);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Playoff bracket cleared.')]);

        return back();
    }

    private function assertCategoryBelongs(Tournament $tournament, TournamentCategory $category): void
    {
        abort_if($category->tournament_id !== $tournament->id, 404);
    }
}
