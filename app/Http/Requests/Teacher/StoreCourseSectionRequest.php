<?php

declare(strict_types=1);

namespace App\Http\Requests\Teacher;

use Illuminate\Foundation\Http\FormRequest;

final class StoreCourseSectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        
        
        
        return true;
    }


    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_published' => ['sometimes', 'boolean'],
            'unlock_date' => ['nullable', 'date', 'after_or_equal:today'],
            'unlock_after_days' => ['nullable', 'integer', 'min:0']
        ];
    }


    protected function prepareForValidation(): void
    {
        $this->merge([
            'is_published' => $this->boolean('is_published'),
        ]);
    }
}
