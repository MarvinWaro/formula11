<?php

namespace App\Http\Responses;

use App\Http\Responses\Concerns\RedirectsToCurrentTeam;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Laravel\Fortify\Fortify;
use Symfony\Component\HttpFoundation\Response;

class LoginResponse implements LoginResponseContract
{
    use RedirectsToCurrentTeam;

    public function toResponse($request): Response
    {
        if ($request->wantsJson()) {
            return new JsonResponse(['two_factor' => false], 200);
        }

        $target = $this->redirectPathForCurrentTeam($request, Fortify::redirects('login'));

        $intended = $request->session()->pull('url.intended');

        if ($intended && $this->isSafeIntended($request, $intended)) {
            return redirect($intended);
        }

        return redirect($target);
    }

    private function isSafeIntended(Request $request, string $url): bool
    {
        $path = parse_url($url, PHP_URL_PATH);

        if (! $path) {
            return false;
        }

        $user = $request->user();
        $team = $user?->currentTeam ?? $user?->personalTeam();

        if (! $team) {
            return true;
        }

        if (! preg_match('#^/([^/]+)/#', $path, $matches)) {
            return true;
        }

        return $matches[1] === $team->slug;
    }
}
