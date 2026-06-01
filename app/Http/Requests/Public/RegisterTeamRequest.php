<?php

namespace App\Http\Requests\Public;

use App\Models\Hei;
use App\Models\TournamentCategory;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterTeamRequest extends FormRequest
{
    /**
     * Public route; no auth required.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $isAuthenticated = $this->user() !== null;

        return [
            'category_id' => ['required', 'integer', Rule::exists(TournamentCategory::class, 'id')],
            'hei_id' => ['nullable', 'integer', Rule::exists(Hei::class, 'id')],
            'captain_name' => ['required', 'string', 'max:255'],
            'captain_email' => ['required', 'string', 'email', 'max:255'],
            'captain_phone' => ['nullable', 'string', 'max:32'],
            'captain_password' => [
                $isAuthenticated ? 'nullable' : 'required',
                'nullable',
                'string',
                'min:8',
                'max:64',
            ],
            'partner_name' => ['required', 'string', 'max:255'],
        ];
    }
}
