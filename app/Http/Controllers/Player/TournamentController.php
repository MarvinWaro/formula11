<?php

namespace App\Http\Controllers\Player;

use App\Actions\Tournaments\JoinTeamAsPartner;
use App\Actions\Tournaments\RegisterTeam;
use App\Enums\TournamentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Player\AcceptInviteRequest;
use App\Http\Requests\Player\RegisterTournamentTeamRequest;
use App\Models\Hei;
use App\Models\Role;
use App\Models\Tournament;
use App\Models\TournamentCategory;
use App\Models\TournamentTeam;
use App\Services\Scoring\CategoryStandingsBuilder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TournamentController extends Controller
{
    public function __construct(protected CategoryStandingsBuilder $standingsBuilder) {}

    public function index(Request $request): Response
    {
        $this->authorizePlayer($request);

        $userId = $request->user()->id;

        $tournaments = Tournament::query()
            ->where(function ($q) use ($userId) {
                // Either still accepting registrations…
                $q->where(function ($open) {
                    $open->where('status', TournamentStatus::RegistrationOpen->value)
                        ->where(fn ($deadline) => $deadline
                            ->whereNull('registration_deadline')
                            ->orWhere('registration_deadline', '>', now()));
                })
                    // …or the player already has an active team in it,
                    // regardless of status (in-progress, completed, etc).
                    ->orWhereHas('categories.teams', function ($team) use ($userId) {
                        $team->where('status', TournamentTeam::STATUS_ACTIVE)
                            ->whereHas('players', fn ($p) => $p->where('user_id', $userId));
                    });
            })
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
                'venue_lat' => $tournament->venue_lat !== null ? (float) $tournament->venue_lat : null,
                'venue_lng' => $tournament->venue_lng !== null ? (float) $tournament->venue_lng : null,
                'description' => $tournament->description,
                'registration_fee' => $tournament->registration_fee !== null ? (float) $tournament->registration_fee : null,
                'starts_at' => $tournament->starts_at?->toDateString(),
                'ends_at' => $tournament->ends_at?->toDateString(),
                'registration_deadline' => $tournament->registration_deadline?->toIso8601String(),
                'status' => $tournament->status->value,
                'status_label' => $tournament->status->label(),
                'registration_open' => $tournament->isRegistrationOpen(),
                'categories' => $tournament->categories->map(fn (TournamentCategory $category) => $this->categoryPayload($category))->values(),
            ]);

        return Inertia::render('player/tournaments/index', [
            'tournaments' => $tournaments,
        ]);
    }

    public function show(Request $request, Tournament $tournament): Response
    {
        $this->authorizePlayer($request);

        $tournament->load([
            'categories' => fn ($query) => $query->withCount([
                'teams as active_teams_count' => fn ($teamQuery) => $teamQuery->where('status', TournamentTeam::STATUS_ACTIVE),
            ]),
            'categories.pools.teams' => fn ($q) => $q->orderBy('pool_seed'),
            'categories.pools.matches.teamA',
            'categories.pools.matches.teamB',
            'categories.matches.teamA',
            'categories.matches.teamB',
        ]);

        $existingTeams = TournamentTeam::query()
            ->whereHas('category', fn ($q) => $q->where('tournament_id', $tournament->id))
            ->whereHas('players', fn ($q) => $q->where('user_id', $request->user()->id))
            ->where('status', TournamentTeam::STATUS_ACTIVE)
            ->with(['players', 'category', 'hei'])
            ->get();

        // Player may view a tournament if registration is still open OR they
        // already have an active team in it — once a tournament moves to
        // in-progress / completed, their team page must stay reachable so
        // they can follow standings, find their partner, etc.
        $registrationOpen = $tournament->isRegistrationOpen();
        abort_unless($registrationOpen || $existingTeams->isNotEmpty(), 404);

        return Inertia::render('player/tournaments/show', [
            'tournament' => [
                'id' => $tournament->id,
                'name' => $tournament->name,
                'slug' => $tournament->slug,
                'organizer_name' => $tournament->organizer_name,
                'venue' => $tournament->venue,
                'venue_lat' => $tournament->venue_lat !== null ? (float) $tournament->venue_lat : null,
                'venue_lng' => $tournament->venue_lng !== null ? (float) $tournament->venue_lng : null,
                'description' => $tournament->description,
                'registration_fee' => $tournament->registration_fee !== null ? (float) $tournament->registration_fee : null,
                'starts_at' => $tournament->starts_at?->toDateString(),
                'ends_at' => $tournament->ends_at?->toDateString(),
                'registration_deadline' => $tournament->registration_deadline?->toIso8601String(),
                'registration_open' => $registrationOpen,
                'status' => $tournament->status->value,
                'status_label' => $tournament->status->label(),
                'categories' => $tournament->categories->map(fn (TournamentCategory $category) => [
                    ...$this->categoryPayload($category),
                    ...$this->standingsBuilder->build($category),
                ])->values(),
            ],
            'heis' => Hei::query()
                ->orderBy('name')
                ->get(['id', 'name', 'abbreviation'])
                ->map(fn (Hei $hei) => [
                    'id' => $hei->id,
                    'name' => $hei->name,
                    'abbreviation' => $hei->abbreviation,
                ]),
            'existingTeams' => $existingTeams->map(fn (TournamentTeam $t) => [
                'id' => $t->id,
                'category_id' => $t->tournament_category_id,
                'category_skill_level' => $t->category->skill_level->value,
                'display_name' => $t->display_name,
                'category_name' => $t->category->name,
                'hei_name' => $t->hei?->name,
                'partner_token' => $t->partner_token,
                'players' => $t->players->map(fn ($p) => [
                    'display_name' => $p->display_name,
                    'is_captain' => $p->is_captain,
                    'is_placeholder' => $p->user_id === null && ! $p->is_captain,
                ])->values(),
            ])->values(),
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

    public function acceptInvite(
        AcceptInviteRequest $request,
        Tournament $tournament,
        JoinTeamAsPartner $join,
    ): RedirectResponse {
        abort_unless($tournament->status === TournamentStatus::RegistrationOpen, 404);

        $join->handle($tournament, $request->user(), $request->validated('partner_invite'));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('You have joined the team as Player 2.')]);

        return to_route('player.tournaments.show', ['tournament' => $tournament->slug]);
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
            'slug' => $category->slug,
            'division_label' => $category->division->label(),
            'skill_level' => $category->skill_level->value,
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
