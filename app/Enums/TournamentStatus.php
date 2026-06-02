<?php

namespace App\Enums;

enum TournamentStatus: string
{
    case Draft = 'draft';
    case RegistrationOpen = 'registration_open';
    case RegistrationClosed = 'registration_closed';
    case InProgress = 'in_progress';
    case Completed = 'completed';

    /**
     * Get the display label for the status.
     */
    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::RegistrationOpen => 'Registration Open',
            self::RegistrationClosed => 'Registration Closed',
            self::InProgress => 'In Progress',
            self::Completed => 'Completed',
        };
    }

    /**
     * Get the ordered hierarchy. Used by guards that depend on tournament phase.
     */
    public function order(): int
    {
        return match ($this) {
            self::Draft => 0,
            self::RegistrationOpen => 1,
            self::RegistrationClosed => 2,
            self::InProgress => 3,
            self::Completed => 4,
        };
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $status) => ['value' => $status->value, 'label' => $status->label()],
            self::cases(),
        );
    }
}
