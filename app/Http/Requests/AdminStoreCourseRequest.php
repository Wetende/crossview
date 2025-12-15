<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

final class AdminStoreCourseRequest extends StoreCourseRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = parent::rules();
        
        // Add teacher_id validation rule
        $rules['teacher_id'] = ['required', 'integer', Rule::exists('users', 'id')->where(function ($query) {
            $query->whereHas('roles', function ($q) {
                $q->where('name', 'teacher');
            });
        })];
        
        return $rules;
    }
    
    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'teacher_id' => 'Teacher',
        ];
    }
} 