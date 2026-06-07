<?php

namespace App\Http\Controllers\Admin\Scoring;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Scoring\AssignMatchRequest;
use App\Http\Requests\Admin\Scoring\AssignUmpireRequest;
use App\Http\Requests\Admin\Scoring\RecordMatchScoreRequest;
use App\Models\MatchGame;
use App\Models\Tournament;
use App\Models\TournamentCategory;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MatchController extends Controller
{
    public function update(
        RecordMatchScoreRequest $request,
        Tournament $tournament,
        TournamentCategory $category,
        MatchGame $match,
    ): RedirectResponse {
        $this->assertMatchBelongs($tournament, $category, $match);

        $data = $request->validated();

        $winnerId = $data['score_a'] > $data['score_b']
            ? $match->team_a_id
            : $match->team_b_id;

        $match->update([
            'score_a' => $data['score_a'],
            'score_b' => $data['score_b'],
            'winner_team_id' => $winnerId,
            'played_at' => now(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Score recorded.')]);

        return back();
    }

    public function reset(
        Request $request,
        Tournament $tournament,
        TournamentCategory $category,
        MatchGame $match,
    ): RedirectResponse {
        abort_unless($request->user()?->hasPermission('scoring.manage'), 403);
        $this->assertMatchBelongs($tournament, $category, $match);

        $match->update([
            'score_a' => null,
            'score_b' => null,
            'winner_team_id' => null,
            'played_at' => null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Score cleared.')]);

        return back();
    }

    public function assign(
        AssignMatchRequest $request,
        Tournament $tournament,
        TournamentCategory $category,
        MatchGame $match,
    ): RedirectResponse {
        $this->assertMatchBelongs($tournament, $category, $match);

        $courtNumber = $request->validated('court_number');
        $match->update([
            'court_number' => $courtNumber !== null && $courtNumber !== '' ? $courtNumber : null,
        ]);

        return back();
    }

    public function assignUmpire(
        AssignUmpireRequest $request,
        Tournament $tournament,
        TournamentCategory $category,
        MatchGame $match,
    ): RedirectResponse {
        $this->assertMatchBelongs($tournament, $category, $match);

        $umpireId = $request->validated('assigned_umpire_user_id');

        // Only users with the scoring.score permission can be assigned;
        // refusing silently keeps the UI's expectations honest.
        if ($umpireId !== null) {
            $candidate = User::query()->whereKey($umpireId)->first();
            if ($candidate === null || ! $candidate->hasPermission('scoring.score')) {
                return back()->withErrors([
                    'assigned_umpire_user_id' => __('That user is not authorized to score matches.'),
                ]);
            }
        }

        $match->update(['assigned_umpire_user_id' => $umpireId]);

        return back();
    }

    private function assertMatchBelongs(Tournament $tournament, TournamentCategory $category, MatchGame $match): void
    {
        abort_if($category->tournament_id !== $tournament->id, 404);
        abort_if($match->tournament_category_id !== $category->id, 404);
    }
}
