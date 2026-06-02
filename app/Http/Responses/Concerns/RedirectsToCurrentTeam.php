<?php

namespace App\Http\Responses\Concerns;

use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;

trait RedirectsToCurrentTeam
{
    protected function redirectPathForCurrentTeam(Request $request, string $redirect): string
    {
        $team = $this->currentTeam($request);

        if (! $team) {
            return $request->user()?->hasPermission('tournaments.view')
                ? route('admin.tournaments.index', absolute: false)
                : route('home', absolute: false);
        }

        URL::defaults(['current_team' => $team->slug]);

        return "/{$team->slug}{$redirect}";
    }

    protected function currentTeam(Request $request): ?Team
    {
        $user = $request->user();

        return $user?->currentTeam ?? $user?->personalTeam();
    }
}
