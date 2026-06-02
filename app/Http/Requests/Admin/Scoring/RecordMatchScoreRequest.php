<?php

namespace App\Http\Requests\Admin\Scoring;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class RecordMatchScoreRequest extends FormRequest
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
            'score_a' => ['required', 'integer', 'min:0', 'max:99'],
            'score_b' => ['required', 'integer', 'min:0', 'max:99', 'different:score_a'],
        ];
    }
}
