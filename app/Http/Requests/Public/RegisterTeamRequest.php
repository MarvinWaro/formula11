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
            'category_id' => ['required', 'uuid', Rule::exists(TournamentCategory::class, 'id')],
            'hei_id' => ['nullable', 'uuid', Rule::exists(Hei::class, 'id')],
            'registration_mode' => ['required', 'in:pair,solo'],
            'captain_name' => ['required', 'string', 'max:255'],
            'captain_email' => ['required', 'string', 'email', 'max:255'],
            'captain_phone' => ['nullable', 'string', 'max:32'],
            'captain_password' => ['nullable', 'string', 'min:8', 'max:64'],
            'partner_name' => ['required_if:registration_mode,pair', 'nullable', 'string', 'max:255'],
            'partner_email' => ['nullable', 'string', 'email', 'max:255'],
        ];
    }
}
