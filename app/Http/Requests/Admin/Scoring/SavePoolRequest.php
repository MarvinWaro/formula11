<?php

namespace App\Http\Requests\Admin\Scoring;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SavePoolRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:64'],
            'teams' => ['nullable', 'array'],
            'teams.*' => ['uuid', 'distinct'],
        ];
    }
}
