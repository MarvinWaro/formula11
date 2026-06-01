<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Tournaments\SaveCategoryRequest;
use App\Models\Tournament;
use App\Models\TournamentCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class TournamentCategoryController extends Controller
{
    public function store(SaveCategoryRequest $request, Tournament $tournament): RedirectResponse
    {
        Gate::authorize('update', $tournament);

        $tournament->categories()->create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Category added.')]);

        return to_route('admin.tournaments.show', $tournament);
    }

    public function update(SaveCategoryRequest $request, Tournament $tournament, TournamentCategory $category): RedirectResponse
    {
        Gate::authorize('update', $tournament);
        abort_unless($category->tournament_id === $tournament->id, 404);

        $category->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Category updated.')]);

        return to_route('admin.tournaments.show', $tournament);
    }

    public function destroy(Request $request, Tournament $tournament, TournamentCategory $category): RedirectResponse
    {
        Gate::authorize('update', $tournament);
        abort_unless($request->user()->hasPermission('categories.delete'), 403);
        abort_unless($category->tournament_id === $tournament->id, 404);

        $category->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Category deleted.')]);

        return to_route('admin.tournaments.show', $tournament);
    }
}
