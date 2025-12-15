<?php

declare(strict_types=1);

namespace App\Http\Requests\Teacher;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateQuestionRequest extends FormRequest
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
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $rules = [
            'text' => 'required|string',
            'points' => 'nullable|integer|min:1',
            'hint' => 'nullable|string',
            'explanation' => 'nullable|string',
            'image' => 'nullable|image|max:5120', 
            'remove_image' => 'boolean',
            'add_to_my_library' => 'boolean',
            'subject_topic_id' => 'nullable|exists:subject_topics,id',
        ];

        
        $question = $this->route('question');
        $questionType = $question->question_type;

        if (in_array($questionType, ['single_choice', 'multiple_choice', 'true_false'], true)) {
            $rules['options'] = 'required|array|min:2';
            $rules['options.*'] = 'nullable|string'; 
            $rules['is_correct'] = $questionType === 'single_choice' || $questionType === 'true_false'
                ? 'required|array|size:1'
                : 'required|array|min:1';
            $rules['is_correct.*'] = 'integer|min:0';
            $rules['option_images.*'] = 'nullable|image|max:5120';
        }

        
        if ($questionType === 'matching') {
            $rules['matching_pairs'] = 'required|array|min:2';
            $rules['matching_pairs.*.left_text'] = 'required|string|max:255';
            $rules['matching_pairs.*.right_text'] = 'required|string|max:255';
        } elseif ($questionType === 'image_matching') {
            $rules['image_matching_pairs'] = 'required|array|min:1';
            $rules['image_matching_pairs.*.text'] = 'required|string|max:255';
            $rules['image_matching_pairs.*.image'] = 'nullable|image|max:5120';
            $rules['image_matching_pairs.*.existing_image'] = 'nullable|string';
        } elseif ($questionType === 'keywords') {
            $rules['keywords'] = 'required|array|min:1';
            $rules['keywords.*'] = 'required|string|max:255';
            $rules['case_sensitive'] = 'boolean';
        } elseif ($questionType === 'fill_gap') {
            $rules['gaps'] = 'required|array|min:1';
            $rules['gaps.*'] = 'required|array|min:1';
            $rules['gaps.*.*'] = 'required|string|max:255';
            $rules['gap_case_sensitive'] = 'boolean';
        }

        return $rules;
    }
}
