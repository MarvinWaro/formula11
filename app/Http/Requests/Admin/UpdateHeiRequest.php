<?php

namespace App\Http\Requests\Admin;

use App\Models\Hei;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateHeiRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('heis.edit') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $heiId = $this->route('hei')?->id;

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique(Hei::class, 'name')->ignore($heiId)],
            'abbreviation' => ['nullable', 'string', 'max:32'],
            'region' => ['nullable', 'string', 'max:64'],
        ];
    }
}
