<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\JsonResponse;

final class UploadController extends Controller
{
    /**
     * Handle image uploads from TinyMCE editor.
     */
    public function uploadImage(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $file = $request->file('file');
        $path = $file->store('public/uploads/tinymce');
        $url = Storage::url($path);


        return response()->json([
            'location' => $url,
        ]);
    }
}
