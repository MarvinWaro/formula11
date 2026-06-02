<?php

namespace App\Http\Controllers\Admin\Scoring;

use App\Actions\Scoring\GeneratePoolMatches;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Scoring\SavePoolRequest;
use App\Models\Pool;
use App\Models\Tournament;
use App\Models\TournamentCategory;
use App\Models\TournamentTeam;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PoolController extends Controller
{
    public function store(
        SavePoolRequest $request,
        Tournament $tournament,
        TournamentCategory $category,
    ): RedirectResponse {
        $this->assertCategoryBelongsToTournament($tournament, $category);

        $data = $request->validated();

        DB::transaction(function () use ($data, $category) {
            $pool = $category->pools()->create([
                'name' => $data['name'],
                'display_order' => ($category->pools()->max('display_order') ?? 0) + 1,
            ]);

            $this->syncTeams($pool, $data['teams'] ?? []);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Pool created.')]);

        return back();
    }

    public function update(
        SavePoolRequest $request,
        Tournament $tournament,
        TournamentCategory $category,
        Pool $pool,
    ): RedirectResponse {
        $this->assertPoolBelongs($tournament, $category, $pool);

        $data = $request->validated();

        DB::transaction(function () use ($data, $pool) {
            $pool->update(['name' => $data['name']]);

            $this->syncTeams($pool, $data['teams'] ?? []);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Pool updated.')]);

        return back();
    }

    public function destroy(
        Request $request,
        Tournament $tournament,
        TournamentCategory $category,
        Pool $pool,
    ): RedirectResponse {
        abort_unless($request->user()?->hasPermission('scoring.manage'), 403);
        $this->assertPoolBelongs($tournament, $category, $pool);

        DB::transaction(function () use ($pool) {
            TournamentTeam::query()
                ->where('pool_id', $pool->id)
                ->update(['pool_id' => null, 'pool_seed' => null]);

            $pool->delete();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Pool deleted.')]);

        return back();
    }

    public function generate(
        Request $request,
        Tournament $tournament,
        TournamentCategory $category,
        Pool $pool,
        GeneratePoolMatches $action,
    ): RedirectResponse {
        abort_unless($request->user()?->hasPermission('scoring.manage'), 403);
        $this->assertPoolBelongs($tournament, $category, $pool);

        $created = $action->handle($pool, force: (bool) $request->boolean('force'));

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $created === 0
                ? __('Matches are already up to date.')
                : __(':count match(es) generated.', ['count' => $created]),
        ]);

        return back();
    }

    /**
     * @param  array<int, string>  $teamIds
     */
    private function syncTeams(Pool $pool, array $teamIds): void
    {
        // Clear teams that were in this pool but aren't selected anymore.
        TournamentTeam::query()
            ->where('pool_id', $pool->id)
            ->whereNotIn('id', $teamIds)
            ->update(['pool_id' => null, 'pool_seed' => null]);

        if ($teamIds === []) {
            return;
        }

        // Only teams from the same category can join the pool.
        $validIds = TournamentTeam::query()
            ->whereIn('id', $teamIds)
            ->where('tournament_category_id', $pool->tournament_category_id)
            ->pluck('id')
            ->all();

        foreach ($validIds as $seed => $teamId) {
            TournamentTeam::query()
                ->where('id', $teamId)
                ->update([
                    'pool_id' => $pool->id,
                    'pool_seed' => $seed + 1,
                ]);
        }
    }

    private function assertCategoryBelongsToTournament(Tournament $tournament, TournamentCategory $category): void
    {
        abort_if($category->tournament_id !== $tournament->id, 404);
    }

    private function assertPoolBelongs(Tournament $tournament, TournamentCategory $category, Pool $pool): void
    {
        $this->assertCategoryBelongsToTournament($tournament, $category);
        abort_if($pool->tournament_category_id !== $category->id, 404);
    }
}
