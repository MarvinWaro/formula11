<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['tournament_category_id', 'name', 'display_order'])]
class Pool extends Model
{
    use HasUuids;

    /**
     * @return BelongsTo<TournamentCategory, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(TournamentCategory::class, 'tournament_category_id');
    }

    /**
     * @return HasMany<TournamentTeam, $this>
     */
    public function teams(): HasMany
    {
        return $this->hasMany(TournamentTeam::class)->orderBy('pool_seed');
    }

    /**
     * @return HasMany<MatchGame, $this>
     */
    public function matches(): HasMany
    {
        return $this->hasMany(MatchGame::class)->orderBy('sequence');
    }
}
