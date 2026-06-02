<?php

namespace App\Http\Requests\Admin\Tournaments;

use App\Enums\CategoryDivision;
use App\Enums\SkillLevel;
use App\Enums\TournamentCategoryFormat;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveCategoryRequest extends FormRequest
{
    /**
     * Preserve existing clients that created hybrid categories before formats were selectable.
     */
    protected function prepareForValidation(): void
    {
        $defaults = [];

        if (! $this->filled('format')) {
            $defaults['format'] = TournamentCategoryFormat::RoundRobinElimination->value;
        }

        if (! $this->filled('bracket_size')) {
            $defaults['bracket_size'] = 4;
        }

        if (! $this->filled('teams_advancing_per_bracket')) {
            $defaults['teams_advancing_per_bracket'] = 1;
        }

        if ($defaults !== []) {
            $this->merge($defaults);
        }
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $permission = $this->isMethod('post') ? 'categories.create' : 'categories.edit';

        return $this->user()?->hasPermission($permission) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'division' => ['required', Rule::enum(CategoryDivision::class)],
            'skill_level' => ['required', Rule::enum(SkillLevel::class)],
            'format' => ['required', Rule::enum(TournamentCategoryFormat::class)],
            'rr_points_to_win' => ['required', 'integer', 'min:1', 'max:99'],
            'elim_points_to_win' => ['required', 'integer', 'min:1', 'max:99'],
            'bracket_size' => ['required', 'integer', 'min:2', 'max:16'],
            'teams_advancing_per_bracket' => ['required', 'integer', 'min:1', 'max:4'],
            'max_teams' => ['nullable', 'integer', 'min:2', 'max:999'],
            'registration_fee' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
        ];
    }
}
