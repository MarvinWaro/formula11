<?php

namespace App\Actions\Tournaments;

use App\Models\Tournament;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CreateTournament
{
    /**
     * Create a new tournament owned by the given user.
     *
     * @param  array{name: string, venue?: ?string, starts_at?: ?string, ends_at?: ?string}  $attributes
     */
    public function handle(User $creator, array $attributes): Tournament
    {
        return DB::transaction(fn () => Tournament::create([
            ...$attributes,
            'created_by' => $creator->id,
        ]));
    }
}
