<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'tournament_category_id',
    'hei_id',
    'display_name',
    'captain_email',
    'captain_phone',
    'status',
    'seed',
])]
class TournamentTeam extends Model
{
    public const STATUS_ACTIVE = 'active';

    public const STATUS_WITHDRAWN = 'withdrawn';

    /**
     * @return BelongsTo<TournamentCategory, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(TournamentCategory::class, 'tournament_category_id');
    }

    /**
     * @return BelongsTo<Hei, $this>
     */
    public function hei(): BelongsTo
    {
        return $this->belongsTo(Hei::class);
    }

    /**
     * @return HasMany<TeamPlayer, $this>
     */
    public function players(): HasMany
    {
        return $this->hasMany(TeamPlayer::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'withdrawn_at' => 'datetime',
        ];
    }
}
