<?php

declare(strict_types=1);

namespace App\Http\Requests\Teacher;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\Lesson; 

final class StoreLessonRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        
        
        return true; 
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $lessonTypes = ['text', 'video', 'zoom', 'stream', 'quiz_link', 'assignment_link']; 

        $rules = [
            'title' => ['required', 'string', 'max:255'],
            'lesson_type' => ['required', Rule::in($lessonTypes)],
            'lesson_duration' => ['nullable', 'string', 'max:50'], 
            'is_preview_allowed' => ['sometimes', 'boolean'],
            'unlock_date' => ['nullable', 'date', 'after_or_equal:today'],
            'unlock_after_purchase_days' => ['nullable', 'integer', 'min:0'],
            'lesson_start_datetime' => ['nullable', 'date', 'after_or_equal:today'],
            
        ];

        
        switch ($this->input('lesson_type')) {
            case 'text':
                $rules['short_description'] = ['nullable', 'string']; 
                $rules['content'] = ['required', 'string']; 
                break;
            case 'video':
                $rules['video_url'] = ['required', 'url_if_not_embed', 'string']; 
                $rules['short_description'] = ['nullable', 'string']; 
                $rules['supplementary_content'] = ['nullable', 'string']; 
                break;
            case 'stream':
            case 'zoom':
                $rules['meeting_url'] = ['required', 'url'];
                $rules['meeting_id'] = ['nullable', 'string', 'max:255'];
                $rules['meeting_password'] = ['nullable', 'string', 'max:255'];
                $rules['start_time'] = ['required', 'date', 'after_or_equal:today'];
                $rules['short_description'] = ['nullable', 'string']; 
                $rules['supplementary_content'] = ['nullable', 'string']; 
                break;
            case 'quiz_link':
                $rules['linked_quiz_id'] = ['required', 'integer', Rule::exists('quizzes', 'id')->where(function ($query) {
                    
                    
                })];
                break;
            case 'assignment_link':
                $rules['linked_assignment_id'] = ['required', 'integer', Rule::exists('assignments', 'id')->where(function ($query) {
                    
                })];
                break;
        }

        return $rules;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'is_preview_allowed' => $this->boolean('is_preview_allowed'),
        ]);

        
        
    }

    /**
     * Get custom messages for validator errors.
     *
     */
    public function messages(): array
    {
        return [
            'video_url.url_if_not_embed' => 'The video URL must be a valid URL or embed code.' 
        ];
    }
}
