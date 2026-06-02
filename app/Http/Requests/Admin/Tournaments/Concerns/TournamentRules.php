<?php

namespace App\Http\Requests\Admin\Tournaments\Concerns;

class TournamentRules
{
    /**
     * Shared validation rules for storing/updating a tournament.
     *
     * @return array<string, array<int, string>>
     */
    public static function all(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'organizer_name' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'venue' => ['nullable', 'string', 'max:255'],
            'venue_lat' => ['nullable', 'numeric', 'between:-90,90'],
            'venue_lng' => ['nullable', 'numeric', 'between:-180,180'],
            'registration_fee' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'registration_deadline' => ['nullable', 'date'],
        ];
    }
}
