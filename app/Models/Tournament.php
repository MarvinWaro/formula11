<?php

namespace App\Models;

use App\Concerns\GeneratesUniqueTournamentSlugs;
use App\Enums\TournamentStatus;
use App\Observers\TournamentObserver;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['name', 'slug', 'venue', 'organizer_name', 'starts_at', 'ends_at', 'status', 'registration_code', 'created_by'])]
#[ObservedBy([TournamentObserver::class])]
class Tournament extends Model
{
    use GeneratesUniqueTournamentSlugs, SoftDeletes;

    /**
     * The model's default attribute values.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => 'draft',
    ];

    /**
     * Get the categories defined for this tournament.
     *
     * @return HasMany<TournamentCategory, $this>
     */
    public function categories(): HasMany
    {
        return $this->hasMany(TournamentCategory::class);
    }

    /**
     * Get the user who created this tournament.
     *
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'starts_at' => 'date',
            'ends_at' => 'date',
            'status' => TournamentStatus::class,
        ];
    }

    /**
     * Use slug for route model binding.
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
