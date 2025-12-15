<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateBadgeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() && $this->user()->isAdmin();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('badges')->ignore($this->badge)],
            'description' => ['nullable', 'string'],
            'icon' => ['nullable', 'image', 'max:2048'], 
            'points' => ['nullable', 'integer', 'min:0'],
            'criteria_type' => ['required', 'string', 'max:255'],
            'criteria_value' => ['required', 'string', 'max:255'],
            'is_active' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'The badge name is required.',
            'criteria_type.required' => 'The criteria type is required.',
            'criteria_value.required' => 'The criteria value is required.',
            'icon.image' => 'The uploaded file must be an image.',
            'icon.max' => 'The image size must not exceed 2MB.',
        ];
    }
}
