<?php

namespace App\Http\Requests\Admin;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveRoleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $permission = $this->isMethod('post') ? 'roles.create' : 'roles.edit';

        return $this->user()?->hasPermission($permission) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $roleId = $this->route('role')?->id;

        return [
            'label' => ['required', 'string', 'max:255'],
            'name' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9_]+$/',
                $roleId === null
                    ? Rule::unique(Role::class, 'name')
                    : Rule::unique(Role::class, 'name')->ignore($roleId),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
            'permissions' => ['array'],
            'permissions.*' => ['string', Rule::exists(Permission::class, 'name')],
        ];
    }

    /**
     * Get custom error messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.regex' => 'The role identifier may only contain lowercase letters, numbers, and underscores.',
        ];
    }
}
