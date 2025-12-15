<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SubjectCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;

final class SubjectCategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): View
    {
        $categories = SubjectCategory::orderBy('level')
            ->orderBy('position')
            ->get();
            
        return view('admin.subject-categories.index', compact('categories'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): View
    {
        return view('admin.subject-categories.create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:subject_categories'],
            'description' => ['nullable', 'string'],
            'level' => ['required', 'string', Rule::in(['Junior Secondary', 'Senior School'])],
            'position' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        $validated['slug'] = Str::slug($validated['name']);
        $validated['is_active'] = $request->has('is_active');
        
        SubjectCategory::create($validated);
        
        return redirect()->route('admin.subject-categories.index')
            ->with('success', 'Subject category created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(SubjectCategory $subjectCategory): View
    {
        return view('admin.subject-categories.show', [
            'category' => $subjectCategory,
            'subjects' => $subjectCategory->subjects()->orderBy('name')->get()
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(SubjectCategory $subjectCategory): View
    {
        return view('admin.subject-categories.edit', [
            'category' => $subjectCategory
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, SubjectCategory $subjectCategory): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('subject_categories')->ignore($subjectCategory->id)],
            'description' => ['nullable', 'string'],
            'level' => ['required', 'string', Rule::in(['Junior Secondary', 'Senior School'])],
            'position' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        $validated['slug'] = Str::slug($validated['name']);
        $validated['is_active'] = $request->has('is_active');
        
        $subjectCategory->update($validated);
        
        return redirect()->route('admin.subject-categories.index')
            ->with('success', 'Subject category updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(SubjectCategory $subjectCategory): RedirectResponse
    {
        // Check if there are subjects using this category
        if ($subjectCategory->subjects()->count() > 0) {
            return redirect()->route('admin.subject-categories.index')
                ->with('error', 'Cannot delete this category because it has subjects associated with it.');
        }
        
        $subjectCategory->delete();
        
        return redirect()->route('admin.subject-categories.index')
            ->with('success', 'Subject category deleted successfully.');
    }
}
