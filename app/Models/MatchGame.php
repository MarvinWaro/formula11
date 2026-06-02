<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'tournament_category_id',
    'pool_id',
    'stage',
    'sequence',
    'team_a_id',
    'team_b_id',
    'score_a',
    'score_b',
    'winner_team_id',
    'played_at',
])]
class MatchGame extends Model
{
    use HasUuids;

    public const STAGE_POOL = 'pool';

    public const STAGE_SEMI = 'semi';

    public const STAGE_BRONZE = 'bronze';

    public const STAGE_FINAL = 'final';

    /**
     * @var string
     */
    protected $table = 'matches';

    /**
     * @return BelongsTo<TournamentCategory, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(TournamentCategory::class, 'tournament_category_id');
    }

    /**
     * @return BelongsTo<Pool, $this>
     */
    public function pool(): BelongsTo
    {
        return $this->belongsTo(Pool::class);
    }

    /**
     * @return BelongsTo<TournamentTeam, $this>
     */
    public function teamA(): BelongsTo
    {
        return $this->belongsTo(TournamentTeam::class, 'team_a_id');
    }

    /**
     * @return BelongsTo<TournamentTeam, $this>
     */
    public function teamB(): BelongsTo
    {
        return $this->belongsTo(TournamentTeam::class, 'team_b_id');
    }

    /**
     * @return BelongsTo<TournamentTeam, $this>
     */
    public function winner(): BelongsTo
    {
        return $this->belongsTo(TournamentTeam::class, 'winner_team_id');
    }

    public function isComplete(): bool
    {
        return $this->score_a !== null && $this->score_b !== null;
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'played_at' => 'datetime',
        ];
    }
}
