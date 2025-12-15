<?php

declare(strict_types=1);

namespace App\Http\Requests\Teacher;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

final class StoreLessonAttachmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        
        
        
        return Auth::check();
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:102400'], 
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
