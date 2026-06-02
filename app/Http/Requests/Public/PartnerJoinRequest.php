<?php

namespace App\Http\Requests\Public;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class PartnerJoinRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'partner_name' => ['required', 'string', 'max:255'],
            'partner_email' => ['required', 'string', 'email', 'max:255'],
            'partner_password' => ['nullable', 'string', 'min:8', 'max:64'],
        ];
    }
}
