<?php

namespace App\Http\Requests\Umpire;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class FinalizeScoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('scoring.score') ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'score_a' => ['required', 'integer', 'min:0', 'max:99'],
            'score_b' => ['required', 'integer', 'min:0', 'max:99'],
        ];
    }
}
