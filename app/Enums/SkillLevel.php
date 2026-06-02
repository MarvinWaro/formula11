<?php

namespace App\Enums;

enum SkillLevel: string
{
    case Beginner = 'beginner';
    case Novice = 'novice';
    case Intermediate = 'intermediate';

    /**
     * Get the display label for the skill level.
     */
    public function label(): string
    {
        return ucfirst($this->value);
    }

    /**
     * Short description of typical player ability at this level. Based on
     * common pickleball self-rating guidance (e.g. USA Pickleball / DUPR).
     */
    public function description(): string
    {
        return match ($this) {
            self::Beginner => 'New to pickleball. Learning the basic rules, scoring, and grip. Can keep a short rally on simple shots.',
            self::Novice => 'Comfortable with serves and returns. Sustains rallies and is starting to learn dinks and the third-shot drop.',
            self::Intermediate => 'Consistent groundstrokes and serves. Uses dinks and drops in play. Understands kitchen rules and basic doubles positioning.',
        };
    }

    /**
     * Get the option list for forms (value + label + description).
     *
     * @return array<int, array{value: string, label: string, description: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $case) => [
                'value' => $case->value,
                'label' => $case->label(),
                'description' => $case->description(),
            ],
            self::cases(),
        );
    }
}
