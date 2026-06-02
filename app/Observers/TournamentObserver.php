<?php

namespace App\Observers;

use App\Models\Tournament;
use Illuminate\Support\Str;

class TournamentObserver
{
    /**
     * Auto-fill slug and registration_code before insert.
     */
    public function creating(Tournament $tournament): void
    {
        if (empty($tournament->slug) && ! empty($tournament->name)) {
            $tournament->slug = Tournament::generateUniqueTournamentSlug($tournament->name);
        }

        if (empty($tournament->registration_code)) {
            $tournament->registration_code = static::makeRegistrationCode();
        }
    }

    /**
     * Re-slug when the name changes.
     */
    public function updating(Tournament $tournament): void
    {
        if ($tournament->isDirty('name')) {
            $tournament->slug = Tournament::generateUniqueTournamentSlug($tournament->name, $tournament->id);
        }
    }

    /**
     * Build a short, unguessable registration code.
     */
    protected static function makeRegistrationCode(): string
    {
        do {
            $code = Str::upper(Str::random(12));
        } while (Tournament::withTrashed()->where('registration_code', $code)->exists());

        return $code;
    }
}
