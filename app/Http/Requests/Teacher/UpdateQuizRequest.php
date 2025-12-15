<?php

declare(strict_types=1);

namespace App\Http\Requests\Teacher;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

use App\Models\Quiz;

final class UpdateQuizRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        
        
        return Auth::check() && Auth::user()->role === 'teacher';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        $teacher = Auth::user();


        return [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',

            'questions' => 'required|array|min:1',
            'questions.*.id' => 'nullable|integer|exists:questions,id', 
            'questions.*.text' => 'required|string|max:65535',
            'questions.*.type' => 'required|string|in:single_choice,multiple_choice,true_false,matching,image_matching,keywords,fill_gap',
            'questions.*.points' => 'nullable|integer|min:0',
            'questions.*.order' => 'required|integer|min:0',
            
            'questions.*.options' => 'required_if:questions.*.type,single_choice,multiple_choice|array|min:2',
            'questions.*.options.*.id' => 'nullable|integer|exists:question_options,id', 
            'questions.*.options.*.text' => 'required_if:questions.*.type,single_choice,multiple_choice|string|max:1000',
            'questions.*.options.*.is_correct' => 'required_if:questions.*.type,single_choice,multiple_choice|boolean',
            'questions.*.options.*.order' => 'required_if:questions.*.type,single_choice,multiple_choice|integer|min:0',
            
            'questions.*.correct_answer_tf' => 'required_if:questions.*.type,true_false|boolean',
            'questions.*.correct_answer_short' => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'questions.required' => 'At least one question is required for the quiz.',
            'questions.*.options.required_if' => 'Options are required for multiple choice questions.',
            'questions.*.options.min' => 'Multiple choice questions must have at least 2 options.',
            'questions.*.id.exists' => 'One or more questions are invalid.', 
            'questions.*.options.*.id.exists' => 'One or more question options are invalid.',
        ];
    }
}
