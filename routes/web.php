<?php

use App\Http\Controllers\Admin\TournamentCategoryController;
use App\Http\Controllers\Admin\TournamentController;
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

Route::middleware('throttle:30,1')->prefix('register')->name('public.register.')->group(function () {
    Route::get('{code}', [TournamentRegistrationController::class, 'show'])->name('show');
    Route::post('{code}', [TournamentRegistrationController::class, 'store'])->name('store');
    Route::get('{code}/success/{team}', [TournamentRegistrationController::class, 'success'])->name('success');
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
});

require __DIR__.'/settings.php';
