<?php

namespace App\Models;

use App\Concerns\GeneratesUniqueTournamentSlugs;
use App\Enums\TournamentStatus;
use App\Observers\TournamentObserver;
use App\Support\HtmlSanitizer;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['name', 'slug', 'venue', 'venue_lat', 'venue_lng', 'description', 'registration_fee', 'organizer_name', 'starts_at', 'ends_at', 'registration_deadline', 'status', 'registration_code', 'created_by'])]
#[ObservedBy([TournamentObserver::class])]
class Tournament extends Model
{
    use GeneratesUniqueTournamentSlugs, HasUuids, SoftDeletes;

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
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'registration_deadline' => 'datetime',
            'status' => TournamentStatus::class,
            'registration_fee' => 'decimal:2',
            'venue_lat' => 'decimal:7',
            'venue_lng' => 'decimal:7',
        ];
    }

    /**
     * Use slug for route model binding.
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /**
     * Sanitize description HTML on write — only admins set it, but defense
     * in depth keeps the public render safe.
     *
     * @return Attribute<string|null, string|null>
     */
    protected function description(): Attribute
    {
        return Attribute::make(
            set: fn (?string $value) => HtmlSanitizer::clean($value),
        );
    }

    /**
     * True when the status is open AND the deadline (if any) has not yet passed.
     */
    public function isRegistrationOpen(): bool
    {
        if ($this->status !== TournamentStatus::RegistrationOpen) {
            return false;
        }

        if ($this->registration_deadline === null) {
            return true;
        }

        return $this->registration_deadline->isFuture();
    }
}
