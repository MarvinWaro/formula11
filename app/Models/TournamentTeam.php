<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'tournament_category_id',
    'hei_id',
    'pool_id',
    'pool_seed',
    'display_name',
    'captain_email',
    'captain_phone',
    'partner_email',
    'partner_token',
    'status',
    'seed',
])]
class TournamentTeam extends Model
{
    use HasUuids;

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
     * @return BelongsTo<Pool, $this>
     */
    public function pool(): BelongsTo
    {
        return $this->belongsTo(Pool::class);
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
