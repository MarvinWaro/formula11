<?php

namespace App\Http\Controllers\Public;

use App\Actions\Tournaments\RegisterTeam;
use App\Http\Controllers\Controller;
use App\Http\Requests\Public\RegisterTeamRequest;
use App\Models\Hei;
use App\Models\Tournament;
use App\Models\TournamentCategory;
use App\Models\TournamentTeam;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TournamentRegistrationController extends Controller
{
    /**
     * Show the public registration page for a tournament code.
     */
    public function show(Request $request, string $code): Response
    {
        $tournament = Tournament::query()
            ->where('registration_code', $code)
            ->with(['categories' => fn ($q) => $q->withCount([
                'teams as active_teams_count' => fn ($teamQuery) => $teamQuery->where('status', TournamentTeam::STATUS_ACTIVE),
            ])])
            ->firstOrFail();

        $isOpen = $tournament->isRegistrationOpen();
        $user = $request->user();

        return Inertia::render('register/show', [
            'tournament' => [
                'name' => $tournament->name,
                'slug' => $tournament->slug,
                'organizer_name' => $tournament->organizer_name,
                'venue' => $tournament->venue,
                'description' => $tournament->description,
                'starts_at' => $tournament->starts_at?->toDateString(),
                'ends_at' => $tournament->ends_at?->toDateString(),
                'registration_deadline' => $tournament->registration_deadline?->toIso8601String(),
                'status' => $tournament->status->value,
                'registration_open' => $isOpen,
            ],
            'registrationCode' => $code,
            'categories' => $tournament->categories->map(fn (TournamentCategory $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'division_label' => $c->division->label(),
                'skill_level_label' => $c->skill_level->label(),
                'format' => $c->format->value,
                'format_label' => $c->format->label(),
                'rr_points_to_win' => $c->rr_points_to_win,
                'elim_points_to_win' => $c->elim_points_to_win,
                'registration_fee' => $c->registration_fee !== null ? (float) $c->registration_fee : null,
                'max_teams' => $c->max_teams,
                'registered_teams' => $c->active_teams_count,
                'is_full' => $c->max_teams !== null && $c->active_teams_count >= $c->max_teams,
            ]),
            'heis' => Hei::query()
                ->orderBy('name')
                ->get(['id', 'name', 'abbreviation'])
                ->map(fn (Hei $h) => [
                    'id' => $h->id,
                    'name' => $h->name,
                    'abbreviation' => $h->abbreviation,
                ]),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ] : null,
            ],
        ]);
    }

    /**
     * Handle a public team registration.
     */
    public function store(RegisterTeamRequest $request, string $code, RegisterTeam $action): RedirectResponse
    {
        $tournament = Tournament::query()
            ->where('registration_code', $code)
            ->firstOrFail();

        $team = $action->handle($tournament, $request->validated(), $request->user());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Team registered.')]);

        return redirect()->route('public.register.success', [
            'code' => $code,
            'team' => $team->id,
        ]);
    }

    /**
     * Confirmation page after a successful registration.
     */
    public function success(Request $request, string $code, TournamentTeam $team): Response
    {
        $tournament = Tournament::query()
            ->where('registration_code', $code)
            ->firstOrFail();

        $team->load(['category', 'hei', 'players']);

        return Inertia::render('register/success', [
            'tournament' => [
                'name' => $tournament->name,
                'organizer_name' => $tournament->organizer_name,
                'venue' => $tournament->venue,
            ],
            'team' => [
                'id' => $team->id,
                'display_name' => $team->display_name,
                'category_name' => $team->category->name,
                'category_division' => $team->category->division->label(),
                'hei_name' => $team->hei?->name,
                'partner_token' => $team->partner_token,
                'players' => $team->players->map(fn ($p) => [
                    'display_name' => $p->display_name,
                    'is_captain' => $p->is_captain,
                ]),
            ],
        ]);
    }
}
