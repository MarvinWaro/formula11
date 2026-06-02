<?php

namespace App\Http\Requests\Player;

use App\Models\Hei;
use App\Models\Role;
use App\Models\TournamentCategory;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterTournamentTeamRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->hasRole(Role::PLAYER) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'category_id' => ['required', 'uuid', Rule::exists(TournamentCategory::class, 'id')],
            'hei_id' => ['nullable', 'uuid', Rule::exists(Hei::class, 'id')],
            'registration_mode' => ['required', 'in:pair,solo'],
            'captain_phone' => ['nullable', 'string', 'max:32'],
            'partner_name' => ['required_if:registration_mode,pair', 'nullable', 'string', 'max:255'],
            'partner_email' => ['nullable', 'string', 'email', 'max:255'],
        ];
    }
}
