<?php

namespace App\Http\Requests\Admin\Scoring;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AssignUmpireRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('scoring.manage') ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'assigned_umpire_user_id' => [
                'nullable',
                'uuid',
                Rule::exists(User::class, 'id'),
            ],
        ];
    }
}
