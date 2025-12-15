<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class StoreInviteCodeLinkRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        
        return $this->user() && $this->user()->hasRole('parent');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'invite_code' => [
                'required',
                'string',
                'size:8',
                'regex:/^[A-Z0-9]{8}$/',
            ],
        ];
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'invite_code.required' => 'Please enter an invite code.',
            'invite_code.size' => 'The invite code must be exactly 8 characters long.',
            'invite_code.regex' => 'The invite code must contain only uppercase letters and numbers.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'invite_code' => 'invite code',
        ];
    }
}
