<?php

declare(strict_types=1);

namespace App\Http\Requests\Teacher;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use App\Models\Thread;

final class UpdateThreadRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        if (!Auth::check() || Auth::user()->role !== 'teacher') {
            return false;
        }

        $thread = $this->route('thread');
        if ($thread instanceof Thread) {
            
            return $thread->user_id === Auth::id() || ($thread->course && $thread->course->teacher_id === Auth::id());
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
            
        ];
    }
}
