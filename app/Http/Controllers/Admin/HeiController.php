<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreHeiRequest;
use App\Http\Requests\Admin\UpdateHeiRequest;
use App\Models\Hei;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HeiController extends Controller
{
    /**
     * Display a listing of HEIs.
     */
    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasPermission('heis.view'), 403);

        $heis = Hei::query()
            ->orderBy('name')
            ->get(['id', 'name', 'abbreviation', 'region', 'created_at'])
            ->map(fn (Hei $hei) => [
                'id' => $hei->id,
                'name' => $hei->name,
                'abbreviation' => $hei->abbreviation,
                'region' => $hei->region,
                'created_at' => $hei->created_at->toISOString(),
            ]);

        return Inertia::render('settings/heis/index', [
            'heis' => $heis,
            'permissions' => [
                'canCreate' => $request->user()->hasPermission('heis.create'),
                'canEdit' => $request->user()->hasPermission('heis.edit'),
                'canDelete' => $request->user()->hasPermission('heis.delete'),
            ],
        ]);
    }

    /**
     * Store a newly created HEI.
     */
    public function store(StoreHeiRequest $request): RedirectResponse
    {
        Hei::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('HEI created.')]);

        return to_route('admin.heis.index');
    }

    /**
     * Update the specified HEI.
     */
    public function update(UpdateHeiRequest $request, Hei $hei): RedirectResponse
    {
        $hei->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('HEI updated.')]);

        return to_route('admin.heis.index');
    }

    /**
     * Remove the specified HEI.
     */
    public function destroy(Request $request, Hei $hei): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('heis.delete'), 403);

        $hei->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('HEI deleted.')]);

        return to_route('admin.heis.index');
    }
}
