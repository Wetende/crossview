<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateSubscriptionTierRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->hasRole('admin'); 
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $tierId = $this->route('subscription_tier')->id;

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('subscription_tiers', 'name')->ignore($tierId)],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'level' => ['required', 'integer', 'min:0', Rule::unique('subscription_tiers', 'level')->ignore($tierId)],
            'duration_days' => ['required', 'integer', 'min:0'],
            'max_courses' => ['nullable', 'integer', 'min:0'],
            'features' => ['nullable', 'json'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'is_active' => $this->boolean('is_active'),
            'max_courses' => $this->max_courses == 0 ? null : $this->max_courses, 
        ]);
    }

    /**
     * Get custom messages for validator errors.
     *
     */
    public function messages(): array
    {
        return [
            'name.unique' => 'The subscription tier name has already been taken.',
            'level.unique' => 'The subscription tier level has already been assigned.',
        ];
    }
}
