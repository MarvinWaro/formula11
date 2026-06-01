<?php

namespace App\Enums;

enum CategoryDivision: string
{
    case Mens = 'mens';
    case Womens = 'womens';
    case Mixed = 'mixed';

    /**
     * Get the display label for the division.
     */
    public function label(): string
    {
        return match ($this) {
            self::Mens => "Men's",
            self::Womens => "Women's",
            self::Mixed => 'Mixed',
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
