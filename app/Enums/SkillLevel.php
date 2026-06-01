<?php

namespace App\Enums;

enum SkillLevel: string
{
    case Beginner = 'beginner';
    case Novice = 'novice';
    case Intermediate = 'intermediate';
    case Executive = 'executive';

    /**
     * Get the display label for the skill level.
     */
    public function label(): string
    {
        return ucfirst($this->value);
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
