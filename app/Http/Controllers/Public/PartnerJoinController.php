<?php

namespace App\Http\Controllers\Public;

use App\Actions\Teams\CreateTeam;
use App\Http\Controllers\Controller;
use App\Http\Requests\Public\PartnerJoinRequest;
use App\Models\Role;
use App\Models\TournamentTeam;
use App\Models\User;
use Illuminate\Auth\AuthManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PartnerJoinController extends Controller
{
    public function __construct(
        protected AuthManager $auth,
        protected CreateTeam $createTeam,
    ) {}

    public function show(Request $request, string $token): Response
    {
        $team = TournamentTeam::query()
            ->where('partner_token', $token)
            ->with(['players', 'category'])
            ->firstOrFail();

        $captain = $team->players->firstWhere('is_captain', true);
        $placeholderPartner = $team->players->first(
            fn ($p) => ! $p->is_captain && $p->user_id === null,
        );

        return Inertia::render('register/join', [
            'token' => $token,
            'team' => [
                'display_name' => $team->display_name,
                'category_name' => $team->category->name,
                'player1_name' => $captain?->display_name ?? 'Player 1',
                'captain_phone' => $team->captain_phone,
                // Pre-fill the partner's name when Player 1 already typed it
                // during pair registration — the partner is "claiming" their
                // existing slot rather than filling it from scratch.
                'placeholder_name' => $placeholderPartner?->display_name,
                'is_claim' => $placeholderPartner !== null,
            ],
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                ] : null,
            ],
        ]);
    }

    public function store(PartnerJoinRequest $request, string $token): RedirectResponse
    {
        $team = TournamentTeam::query()
            ->where('partner_token', $token)
            ->with(['players', 'category.tournament'])
            ->firstOrFail();

        $captain = $team->players->firstWhere('is_captain', true);
        $existingPartner = $team->players->first(
            fn ($p) => ! $p->is_captain,
        );

        // The slot is fully taken only when there's a partner row already
        // bound to a real user account.
        if ($existingPartner && $existingPartner->user_id !== null) {
            throw ValidationException::withMessages([
                'partner_email' => __('This invite link has already been used.'),
            ]);
        }

        // Prevent the team captain (or any current member) from claiming the
        // partner slot themselves — they'd otherwise become both Player 1 AND
        // Player 2 if they happen to be signed in.
        if ($request->user()) {
            $alreadyOnTeam = $team->players->contains(
                fn ($p) => $p->user_id === $request->user()->id,
            );
            if ($alreadyOnTeam) {
                throw ValidationException::withMessages([
                    'partner_email' => __('You are already on this team — share the invite link with someone else.'),
                ]);
            }
        }

        $partner = $request->user() ?? $this->resolvePartner($request->validated());

        if ($existingPartner) {
            // Claim path — Player 1 created the slot during pair registration,
            // now Player 2 is binding their real account to it.
            $existingPartner->update([
                'user_id' => $partner->id,
                'display_name' => $partner->name,
            ]);
        } else {
            // Fill path — solo registration, Player 2 is being created.
            $team->players()->create([
                'user_id' => $partner->id,
                'display_name' => $partner->name,
                'is_captain' => false,
            ]);
        }

        $team->update([
            'display_name' => ($captain?->display_name ?? 'Player 1').' & '.$partner->name,
            'partner_token' => null,
        ]);

        if (! $request->user()) {
            $this->auth->guard()->login($partner);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('You have joined the team!')]);

        $code = $team->category->tournament->registration_code;

        return redirect()->route('public.register.success', [
            'code' => $code,
            'team' => $team->id,
        ]);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function resolvePartner(array $payload): User
    {
        $existing = User::query()->where('email', $payload['partner_email'])->first();

        if ($existing) {
            if (empty($payload['partner_password'])) {
                throw ValidationException::withMessages([
                    'needs_signin' => 'true',
                ]);
            }

            if (! Hash::check($payload['partner_password'], $existing->password)) {
                throw ValidationException::withMessages([
                    'partner_password' => __('That password is incorrect. Try again or reset it.'),
                ]);
            }

            return $existing;
        }

        if (empty($payload['partner_password'])) {
            throw ValidationException::withMessages([
                'needs_password' => 'true',
            ]);
        }

        $user = User::create([
            'name' => trim($payload['partner_name']),
            'email' => $payload['partner_email'],
            'password' => Hash::make($payload['partner_password']),
        ]);

        $this->createTeam->handle($user, $user->name."'s Team", isPersonal: true);
        $user->assignRole(Role::PLAYER);

        return $user;
    }
}
