<?php

namespace App\Http\Requests\Admin\Tournaments;

use App\Enums\CategoryDivision;
use App\Enums\SkillLevel;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveCategoryRequest extends FormRequest
{
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
            'rr_points_to_win' => ['required', 'integer', 'min:1', 'max:99'],
            'elim_points_to_win' => ['required', 'integer', 'min:1', 'max:99'],
            'bracket_size' => ['required', 'integer', 'min:2', 'max:16'],
            'teams_advancing_per_bracket' => ['required', 'integer', 'min:1', 'max:4'],
            'max_teams' => ['nullable', 'integer', 'min:2', 'max:999'],
            'registration_fee' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
        ];
    }
}
