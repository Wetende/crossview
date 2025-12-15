<?php

declare(strict_types=1);

namespace App\Http\Requests\Teacher;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateAssignmentRequest extends FormRequest
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
        return [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'instructions' => 'nullable|string',
            'due_date' => 'nullable|date',
            'points_possible' => 'nullable|integer|min:1',
            'allowed_submission_types' => 'nullable|array',
            'allowed_submission_types.*' => 'string|in:pdf,docx,txt,zip,image,video,audio,link,text',
            'unlock_date' => 'nullable|date',
        ];
    }
}
