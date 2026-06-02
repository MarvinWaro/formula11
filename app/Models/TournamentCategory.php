<?php

namespace App\Models;

use App\Enums\CategoryDivision;
use App\Enums\SkillLevel;
use App\Enums\TournamentCategoryFormat;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

#[Fillable([
    'tournament_id',
    'name',
    'slug',
    'division',
    'skill_level',
    'format',
    'rr_points_to_win',
    'elim_points_to_win',
    'bracket_size',
    'teams_advancing_per_bracket',
    'max_teams',
    'registration_fee',
    'status',
])]
class TournamentCategory extends Model
{
    use HasUuids;

    /**
     * The model's default attribute values.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'format' => 'round_robin_elimination',
    ];

    /**
     * Auto-fill slug per tournament.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (TournamentCategory $category) {
            if (empty($category->slug) && ! empty($category->name)) {
                $category->slug = static::generateUniqueSlug(
                    $category->tournament_id,
                    $category->name,
                );
            }
        });

        static::updating(function (TournamentCategory $category) {
            if ($category->isDirty('name')) {
                $category->slug = static::generateUniqueSlug(
                    $category->tournament_id,
                    $category->name,
                    $category->id,
                );
            }
        });
    }

    /**
     * Get the tournament this category belongs to.
     *
     * @return BelongsTo<Tournament, $this>
     */
    public function tournament(): BelongsTo
    {
        return $this->belongsTo(Tournament::class);
    }

    /**
     * Teams registered in this category.
     *
     * @return HasMany<TournamentTeam, $this>
     */
    public function teams(): HasMany
    {
        return $this->hasMany(TournamentTeam::class);
    }

    /**
     * @return HasMany<Pool, $this>
     */
    public function pools(): HasMany
    {
        return $this->hasMany(Pool::class)->orderBy('display_order');
    }

    /**
     * @return HasMany<MatchGame, $this>
     */
    public function matches(): HasMany
    {
        return $this->hasMany(MatchGame::class);
    }

    /**
     * Generate a unique slug scoped to a tournament.
     */
    protected static function generateUniqueSlug(string $tournamentId, string $name, ?string $excludeId = null): string
    {
        $default = Str::slug($name);

        $query = static::query()
            ->where('tournament_id', $tournamentId)
            ->where(function ($query) use ($default) {
                $query->where('slug', $default)
                    ->orWhere('slug', 'like', $default.'-%');
            });

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        $existing = $query->pluck('slug');

        $maxSuffix = $existing
            ->map(function (string $slug) use ($default): ?int {
                if ($slug === $default) {
                    return 0;
                } elseif (preg_match('/^'.preg_quote($default, '/').'-(\d+)$/', $slug, $matches)) {
                    return (int) $matches[1];
                }

                return null;
            })
            ->filter(fn (?int $suffix) => $suffix !== null)
            ->max() ?? 0;

        return $existing->isEmpty() ? $default : $default.'-'.($maxSuffix + 1);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'division' => CategoryDivision::class,
            'skill_level' => SkillLevel::class,
            'format' => TournamentCategoryFormat::class,
            'registration_fee' => 'decimal:2',
        ];
    }
}
