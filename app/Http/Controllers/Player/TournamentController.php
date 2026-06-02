<?php

namespace App\Http\Controllers\Player;

use App\Actions\Tournaments\RegisterTeam;
use App\Enums\TournamentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Player\RegisterTournamentTeamRequest;
use App\Models\Hei;
use App\Models\Role;
use App\Models\Tournament;
use App\Models\TournamentCategory;
use App\Models\TournamentTeam;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TournamentController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorizePlayer($request);

        $tournaments = Tournament::query()
            ->where('status', TournamentStatus::RegistrationOpen->value)
            ->where(fn ($q) => $q
                ->whereNull('registration_deadline')
                ->orWhere('registration_deadline', '>', now()))
            ->with(['categories' => fn ($query) => $query->withCount([
                'teams as active_teams_count' => fn ($teamQuery) => $teamQuery->where('status', TournamentTeam::STATUS_ACTIVE),
            ])])
            ->latest()
            ->get()
            ->map(fn (Tournament $tournament) => [
                'id' => $tournament->id,
                'name' => $tournament->name,
                'slug' => $tournament->slug,
                'organizer_name' => $tournament->organizer_name,
                'venue' => $tournament->venue,
                'starts_at' => $tournament->starts_at?->toDateString(),
                'ends_at' => $tournament->ends_at?->toDateString(),
                'registration_deadline' => $tournament->registration_deadline?->toIso8601String(),
                'categories' => $tournament->categories->map(fn (TournamentCategory $category) => $this->categoryPayload($category))->values(),
            ]);

        return Inertia::render('player/tournaments/index', [
            'tournaments' => $tournaments,
        ]);
    }

    public function show(Request $request, Tournament $tournament): Response
    {
        $this->authorizePlayer($request);
        abort_unless($tournament->status === TournamentStatus::RegistrationOpen, 404);

        $tournament->load(['categories' => fn ($query) => $query->withCount([
            'teams as active_teams_count' => fn ($teamQuery) => $teamQuery->where('status', TournamentTeam::STATUS_ACTIVE),
        ])]);

        $existingTeam = TournamentTeam::query()
            ->whereHas('category', fn ($q) => $q->where('tournament_id', $tournament->id))
            ->whereHas('players', fn ($q) => $q->where('user_id', $request->user()->id))
            ->where('status', TournamentTeam::STATUS_ACTIVE)
            ->with(['players', 'category', 'hei'])
            ->first();

        return Inertia::render('player/tournaments/show', [
            'tournament' => [
                'id' => $tournament->id,
                'name' => $tournament->name,
                'slug' => $tournament->slug,
                'organizer_name' => $tournament->organizer_name,
                'venue' => $tournament->venue,
                'starts_at' => $tournament->starts_at?->toDateString(),
                'ends_at' => $tournament->ends_at?->toDateString(),
                'registration_deadline' => $tournament->registration_deadline?->toIso8601String(),
                'registration_open' => $tournament->isRegistrationOpen(),
                'categories' => $tournament->categories->map(fn (TournamentCategory $category) => $this->categoryPayload($category))->values(),
            ],
            'heis' => Hei::query()
                ->orderBy('name')
                ->get(['id', 'name', 'abbreviation'])
                ->map(fn (Hei $hei) => [
                    'id' => $hei->id,
                    'name' => $hei->name,
                    'abbreviation' => $hei->abbreviation,
                ]),
            'auth' => [
                'user' => [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                ],
            ],
            'existingTeam' => $existingTeam ? [
                'display_name' => $existingTeam->display_name,
                'category_name' => $existingTeam->category->name,
                'hei_name' => $existingTeam->hei?->name,
                'partner_token' => $existingTeam->partner_token,
                'players' => $existingTeam->players->map(fn ($p) => [
                    'display_name' => $p->display_name,
                    'is_captain' => $p->is_captain,
                    'is_placeholder' => $p->user_id === null && ! $p->is_captain,
                ])->values(),
            ] : null,
        ]);
    }

    public function store(RegisterTournamentTeamRequest $request, Tournament $tournament, RegisterTeam $register): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $team = $register->handle($tournament, [
            ...$validated,
            'captain_name' => $user->name,
            'captain_email' => $user->email,
        ], $user);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Team registered.')]);

        return to_route('public.register.success', [
            'code' => $tournament->registration_code,
            'team' => $team->id,
        ]);
    }

    protected function authorizePlayer(Request $request): void
    {
        abort_unless($request->user()?->hasRole(Role::PLAYER), 403);
    }

    /**
     * @return array{id: int, name: string, division_label: string, skill_level_label: string, format: string, format_label: string, rr_points_to_win: int, elim_points_to_win: int, registration_fee: float|null, max_teams: int|null, registered_teams: int, is_full: bool}
     */
    protected function categoryPayload(TournamentCategory $category): array
    {
        $registeredTeams = (int) ($category->active_teams_count ?? 0);

        return [
            'id' => $category->id,
            'name' => $category->name,
            'division_label' => $category->division->label(),
            'skill_level_label' => $category->skill_level->label(),
            'format' => $category->format->value,
            'format_label' => $category->format->label(),
            'rr_points_to_win' => $category->rr_points_to_win,
            'elim_points_to_win' => $category->elim_points_to_win,
            'registration_fee' => $category->registration_fee !== null ? (float) $category->registration_fee : null,
            'max_teams' => $category->max_teams,
            'registered_teams' => $registeredTeams,
            'is_full' => $category->max_teams !== null && $registeredTeams >= $category->max_teams,
        ];
    }
}
