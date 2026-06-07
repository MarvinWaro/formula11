<?php

namespace App\Http\Requests\Admin\Scoring;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class AssignMatchRequest extends FormRequest
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
            'court_number' => ['nullable', 'string', 'max:16'],
        ];
    }
}
