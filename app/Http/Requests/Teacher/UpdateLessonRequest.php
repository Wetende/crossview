<?php

declare(strict_types=1);

namespace App\Http\Requests\Teacher;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\Lesson;

final class UpdateLessonRequest extends FormRequest
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
        
        
        $lesson = $this->route('lesson');

        $rules = [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'lesson_duration' => ['sometimes', 'nullable', 'string', 'max:50'],
            'is_preview_allowed' => ['sometimes', 'boolean'],
            'unlock_date' => ['sometimes', 'nullable', 'date', 'after_or_equal:today'],
            'unlock_after_purchase_days' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'lesson_start_datetime' => ['sometimes', 'nullable', 'date', 'after_or_equal:today'],
        ];

        if ($lesson instanceof Lesson) {
            switch ($lesson->lesson_type) {
                case 'text':
                    $rules['short_description'] = ['sometimes', 'nullable', 'string'];
                    $rules['content'] = ['sometimes', 'required', 'string'];
                    break;
                case 'video':
                    $rules['video_url'] = ['sometimes', 'required', 'url_if_not_embed', 'string'];
                    $rules['short_description'] = ['sometimes', 'nullable', 'string'];
                    $rules['supplementary_content'] = ['sometimes', 'nullable', 'string'];
                    break;
                case 'stream':
                case 'zoom':
                    $rules['meeting_url'] = ['sometimes', 'required', 'url'];
                    $rules['meeting_id'] = ['sometimes', 'nullable', 'string', 'max:255'];
                    $rules['meeting_password'] = ['sometimes', 'nullable', 'string', 'max:255'];
                    $rules['start_time'] = ['sometimes', 'required', 'date', 'after_or_equal:today'];
                    $rules['short_description'] = ['sometimes', 'nullable', 'string'];
                    $rules['supplementary_content'] = ['sometimes', 'nullable', 'string'];
                    break;
                case 'quiz_link':
                    $rules['linked_quiz_id'] = ['sometimes', 'required', 'integer', Rule::exists('quizzes', 'id')];
                    break;
                case 'assignment_link':
                    $rules['linked_assignment_id'] = ['sometimes', 'required', 'integer', Rule::exists('assignments', 'id')];
                    break;
            }
        }

        return $rules;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('is_preview_allowed')) {
            $this->merge([
                'is_preview_allowed' => $this->boolean('is_preview_allowed'),
            ]);
        }
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
