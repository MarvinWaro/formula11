<?php

use App\Http\Controllers\Admin\Scoring\MatchController;
use App\Http\Controllers\Admin\Scoring\PoolController;
use App\Http\Controllers\Admin\Scoring\ScoringController;
use App\Http\Controllers\Admin\TournamentCategoryController;
use App\Http\Controllers\Admin\TournamentController;
use App\Http\Controllers\Player\TournamentController as PlayerTournamentController;
use App\Http\Controllers\Public\PartnerJoinController;
use App\Http\Controllers\Public\TournamentRegistrationController;
use App\Http\Controllers\Teams\TeamInvitationController;
use App\Http\Middleware\EnsureTeamMembership;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::prefix('{current_team}')
    ->middleware(['auth', 'verified', EnsureTeamMembership::class])
    ->group(function () {
        Route::inertia('dashboard', 'dashboard')->name('dashboard');
    });

Route::middleware(['auth'])->group(function () {
    Route::get('invitations/{invitation}/accept', [TeamInvitationController::class, 'accept'])->name('invitations.accept');
});

Route::middleware('throttle:30,1')->group(function () {
    Route::prefix('register')->name('public.register.')->group(function () {
        Route::get('{code}', [TournamentRegistrationController::class, 'show'])->name('show');
        Route::post('{code}', [TournamentRegistrationController::class, 'store'])->name('store');
        Route::get('{code}/success/{team}', [TournamentRegistrationController::class, 'success'])->name('success');
    });

    Route::prefix('join')->name('public.join.')->group(function () {
        Route::get('{token}', [PartnerJoinController::class, 'show'])->name('show');
        Route::post('{token}', [PartnerJoinController::class, 'store'])->name('store');
    });
});

Route::middleware(['auth', 'verified'])->prefix('player/tournaments')->name('player.tournaments.')->group(function () {
    Route::get('/', [PlayerTournamentController::class, 'index'])->name('index');
    Route::get('{tournament:slug}', [PlayerTournamentController::class, 'show'])->name('show');
    Route::post('{tournament:slug}/register', [PlayerTournamentController::class, 'store'])->name('store');
    Route::post('{tournament:slug}/accept-invite', [PlayerTournamentController::class, 'acceptInvite'])->name('accept-invite');
});

Route::middleware(['auth', 'verified'])->prefix('tournaments')->name('admin.tournaments.')->group(function () {
    Route::get('/', [TournamentController::class, 'index'])->name('index');
    Route::post('/', [TournamentController::class, 'store'])->name('store');
    Route::get('{tournament:slug}', [TournamentController::class, 'show'])->name('show');
    Route::patch('{tournament:slug}', [TournamentController::class, 'update'])->name('update');
    Route::delete('{tournament:slug}', [TournamentController::class, 'destroy'])->name('destroy');
    Route::post('{tournament:slug}/advance', [TournamentController::class, 'advanceStatus'])->name('advance');

    Route::post('{tournament:slug}/categories', [TournamentCategoryController::class, 'store'])->name('categories.store');
    Route::patch('{tournament:slug}/categories/{category}', [TournamentCategoryController::class, 'update'])->name('categories.update');
    Route::delete('{tournament:slug}/categories/{category}', [TournamentCategoryController::class, 'destroy'])->name('categories.destroy');

    Route::get('{tournament:slug}/categories/{category}/scoring', [ScoringController::class, 'show'])->name('scoring.show');
    Route::post('{tournament:slug}/categories/{category}/pools', [PoolController::class, 'store'])->name('scoring.pools.store');
    Route::patch('{tournament:slug}/categories/{category}/pools/{pool}', [PoolController::class, 'update'])->name('scoring.pools.update');
    Route::delete('{tournament:slug}/categories/{category}/pools/{pool}', [PoolController::class, 'destroy'])->name('scoring.pools.destroy');
    Route::post('{tournament:slug}/categories/{category}/pools/{pool}/generate', [PoolController::class, 'generate'])->name('scoring.pools.generate');
    Route::patch('{tournament:slug}/categories/{category}/matches/{match}', [MatchController::class, 'update'])->name('scoring.matches.update');
    Route::delete('{tournament:slug}/categories/{category}/matches/{match}/score', [MatchController::class, 'reset'])->name('scoring.matches.reset');
});

Route::middleware(['auth', 'verified'])->prefix('scoring')->name('admin.scoring.')->group(function () {
    Route::get('/', [ScoringController::class, 'index'])->name('index');
});

require __DIR__.'/settings.php';
