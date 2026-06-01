<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Tournaments\CreateTournament;
use App\Actions\Tournaments\TransitionTournamentStatus;
use App\Enums\CategoryDivision;
use App\Enums\SkillLevel;
use App\Enums\TournamentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Tournaments\StoreTournamentRequest;
use App\Http\Requests\Admin\Tournaments\UpdateTournamentRequest;
use App\Models\Role;
use App\Models\Tournament;
use App\Models\TournamentCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class TournamentController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Tournament::class);

        $user = $request->user();

        $tournaments = Tournament::query()
            ->withCount('categories')
            ->with('creator:id,name')
            ->when(
                $user->hasRole(Role::COURT_OWNER) && ! $user->isAdmin(),
                fn ($query) => $query->where('created_by', $user->id),
            )
            ->latest()
            ->get()
            ->map(fn (Tournament $tournament) => $this->summarize($tournament));

        return Inertia::render('tournaments/index', [
            'tournaments' => $tournaments,
            'permissions' => $this->permissionsPayload($request),
        ]);
    }

    public function store(StoreTournamentRequest $request, CreateTournament $create): RedirectResponse
    {
        $tournament = $create->handle($request->user(), $request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Tournament created.')]);

        return to_route('admin.tournaments.show', $tournament);
    }

    public function show(Request $request, Tournament $tournament): Response
    {
        Gate::authorize('view', $tournament);

        $tournament->load(['creator:id,name', 'categories']);

        return Inertia::render('tournaments/show', [
            'tournament' => [
                ...$this->summarize($tournament),
                'venue' => $tournament->venue,
                'organizer_name' => $tournament->organizer_name,
                'starts_at' => $tournament->starts_at?->toDateString(),
                'ends_at' => $tournament->ends_at?->toDateString(),
                'registration_code' => $tournament->registration_code,
                'categories' => $tournament->categories->map(fn (TournamentCategory $c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'slug' => $c->slug,
                    'division' => $c->division->value,
                    'division_label' => $c->division->label(),
                    'skill_level' => $c->skill_level->value,
                    'skill_level_label' => $c->skill_level->label(),
                    'rr_points_to_win' => $c->rr_points_to_win,
                    'elim_points_to_win' => $c->elim_points_to_win,
                    'bracket_size' => $c->bracket_size,
                    'teams_advancing_per_bracket' => $c->teams_advancing_per_bracket,
                    'max_teams' => $c->max_teams,
                    'registration_fee' => $c->registration_fee !== null ? (float) $c->registration_fee : null,
                ]),
            ],
            'divisionOptions' => CategoryDivision::options(),
            'skillLevelOptions' => SkillLevel::options(),
            'permissions' => [
                ...$this->permissionsPayload($request),
                'canCreateCategory' => $request->user()->hasPermission('categories.create'),
                'canEditCategory' => $request->user()->hasPermission('categories.edit'),
                'canDeleteCategory' => $request->user()->hasPermission('categories.delete'),
            ],
        ]);
    }

    public function update(UpdateTournamentRequest $request, Tournament $tournament): RedirectResponse
    {
        Gate::authorize('update', $tournament);

        $tournament->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Tournament updated.')]);

        return to_route('admin.tournaments.show', $tournament);
    }

    public function destroy(Request $request, Tournament $tournament): RedirectResponse
    {
        Gate::authorize('delete', $tournament);

        $tournament->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Tournament deleted.')]);

        return to_route('admin.tournaments.index');
    }

    /**
     * Advance the tournament status one step forward via the guarded action.
     */
    public function advanceStatus(Request $request, Tournament $tournament, TransitionTournamentStatus $transition): RedirectResponse
    {
        Gate::authorize('manage', $tournament);

        $validated = $request->validate([
            'status' => ['required', Rule::enum(TournamentStatus::class)],
        ]);

        try {
            $transition->handle($tournament, TournamentStatus::from($validated['status']));
        } catch (RuntimeException $e) {
            throw ValidationException::withMessages(['status' => $e->getMessage()]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Tournament status updated.')]);

        return to_route('admin.tournaments.show', $tournament->fresh());
    }

    /**
     * @return array{id: int, name: string, slug: string, status: string, status_label: string, categories_count: int, creator: ?string}
     */
    protected function summarize(Tournament $tournament): array
    {
        return [
            'id' => $tournament->id,
            'name' => $tournament->name,
            'slug' => $tournament->slug,
            'status' => $tournament->status->value,
            'status_label' => $tournament->status->label(),
            'categories_count' => $tournament->categories_count ?? $tournament->categories()->count(),
            'creator' => $tournament->creator?->name,
        ];
    }

    /**
     * @return array{canCreate: bool, canEdit: bool, canDelete: bool, canManage: bool}
     */
    protected function permissionsPayload(Request $request): array
    {
        return [
            'canCreate' => $request->user()->hasPermission('tournaments.create'),
            'canEdit' => $request->user()->hasPermission('tournaments.edit'),
            'canDelete' => $request->user()->hasPermission('tournaments.delete'),
            'canManage' => $request->user()->hasPermission('tournaments.manage'),
        ];
    }
}
