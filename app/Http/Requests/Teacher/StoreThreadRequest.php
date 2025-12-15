<?php

declare(strict_types=1);

namespace App\Http\Requests\Teacher;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use App\Models\Course;

final class StoreThreadRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        
        
        if (!Auth::check() || Auth::user()->role !== 'teacher') {
            return false;
        }

        $course = $this->route('course');
        if ($course instanceof Course) {
            
            return $course->teacher_id === Auth::id();
        }
        return false; 
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255|min:5',
            'content' => 'required|string|min:10',
            
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'title.required' => 'A title is required for the thread.',
            'title.min' => 'The thread title must be at least :min characters.',
            'content.required' => 'The content for the first post is required.',
            'content.min' => 'The content must be at least :min characters.',
        ];
    }
}
