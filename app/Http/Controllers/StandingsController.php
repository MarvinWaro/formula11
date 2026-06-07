<?php

namespace App\Http\Controllers;

use App\Models\Tournament;
use App\Models\TournamentCategory;
use App\Services\Scoring\CategoryStandingsBuilder;
use Inertia\Inertia;
use Inertia\Response;

class StandingsController extends Controller
{
    public function __construct(protected CategoryStandingsBuilder $builder) {}

    public function index(Tournament $tournament): Response
    {
        $tournament->load(['categories' => fn ($q) => $q->orderBy('name')]);

        return Inertia::render('standings/index', [
            'tournament' => [
                'id' => $tournament->id,
                'name' => $tournament->name,
                'slug' => $tournament->slug,
                'organizer_name' => $tournament->organizer_name,
                'venue' => $tournament->venue,
                'status' => $tournament->status->value,
                'status_label' => $tournament->status->label(),
                'starts_at' => $tournament->starts_at?->toDateString(),
                'ends_at' => $tournament->ends_at?->toDateString(),
            ],
            'categories' => $tournament->categories->map(fn (TournamentCategory $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
                'division_label' => $c->division->label(),
                'skill_level_label' => $c->skill_level->label(),
                'format_label' => $c->format->label(),
                'rules_label' => $this->rulesLabel($c),
            ])->values(),
        ]);
    }

    public function show(Tournament $tournament, TournamentCategory $category): Response
    {
        abort_if($category->tournament_id !== $tournament->id, 404);

        $category->load([
            'pools.teams' => fn ($q) => $q->orderBy('pool_seed'),
            'pools.matches.teamA',
            'pools.matches.teamB',
            'matches.teamA',
            'matches.teamB',
        ]);

        return Inertia::render('standings/show', [
            'tournament' => [
                'id' => $tournament->id,
                'name' => $tournament->name,
                'slug' => $tournament->slug,
                'organizer_name' => $tournament->organizer_name,
                'venue' => $tournament->venue,
                'status' => $tournament->status->value,
                'status_label' => $tournament->status->label(),
                'starts_at' => $tournament->starts_at?->toDateString(),
                'ends_at' => $tournament->ends_at?->toDateString(),
            ],
            'category' => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'division_label' => $category->division->label(),
                'skill_level_label' => $category->skill_level->label(),
                'format' => $category->format->value,
                'format_label' => $category->format->label(),
                'rr_points_to_win' => (int) $category->rr_points_to_win,
                'elim_points_to_win' => (int) $category->elim_points_to_win,
                'win_by_two' => (bool) $category->win_by_two,
                'teams_advancing_per_bracket' => (int) $category->teams_advancing_per_bracket,
                'rules_label' => $this->rulesLabel($category),
            ],
            ...$this->builder->build($category),
        ]);
    }

    protected function rulesLabel(TournamentCategory $category): string
    {
        $rr = (int) $category->rr_points_to_win;
        $elim = (int) $category->elim_points_to_win;
        $winBy = $category->win_by_two ? ' · Win by 2' : '';

        return match ($category->format->value) {
            'round_robin' => "Race to {$rr}{$winBy}",
            'single_elimination' => "Race to {$elim}{$winBy}",
            default => "Pool race to {$rr} · Bracket race to {$elim}{$winBy}",
        };
    }
}
