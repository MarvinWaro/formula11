<?php

namespace App\Enums;

enum TournamentCategoryFormat: string
{
    case RoundRobin = 'round_robin';
    case SingleElimination = 'single_elimination';
    case RoundRobinElimination = 'round_robin_elimination';

    /**
     * Get the display label for the format.
     */
    public function label(): string
    {
        return match ($this) {
            self::RoundRobin => 'Round Robin',
            self::SingleElimination => 'Single Elimination',
            self::RoundRobinElimination => 'Round Robin + Elimination',
        };
    }

    /**
     * Get the option list for forms.
     *
     * @return array<int, array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $case) => ['value' => $case->value, 'label' => $case->label()],
            self::cases(),
        );
    }
}
