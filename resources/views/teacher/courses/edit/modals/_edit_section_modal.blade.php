<!-- Edit Section Modal -->
<div class="modal fade" id="editSectionModal{{ $section->id }}" tabindex="-1" aria-labelledby="editSectionModalLabel{{ $section->id }}" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <form action="{{ route('teacher.courses.sections.update', [$course, $section]) }}" method="POST">
                @csrf
                @method('PUT')
                <div class="modal-header">
                    <h5 class="modal-title" id="editSectionModalLabel{{ $section->id }}">Edit Section</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label for="title{{ $section->id }}" class="form-label">Section Title</label>
                        <input type="text" class="form-control" id="title{{ $section->id }}" name="title" required value="{{ old('title', $section->title) }}">
                    </div>
                    <div class="mb-3">
                        <label for="description{{ $section->id }}" class="form-label">Description (Optional)</label>
                        <textarea class="form-control" id="description{{ $section->id }}" name="description" rows="3">{{ old('description', $section->description) }}</textarea>
                    </div>
                    <div class="mb-3">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="is_published{{ $section->id }}" name="is_published" value="1" {{ old('is_published', $section->is_published) ? 'checked' : '' }}>
                            <label class="form-check-label" for="is_published{{ $section->id }}">
                                Publish this section
                            </label>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label for="unlock_date{{ $section->id }}" class="form-label">Unlock Date (Optional)</label>
                        <input type="datetime-local" class="form-control" id="unlock_date{{ $section->id }}" name="unlock_date" value="{{ old('unlock_date', $section->unlock_date ? $section->unlock_date->format('Y-m-d\TH:i') : '') }}">
                        <small class="text-muted">Leave empty to make available immediately.</small>
                    </div>
                    <div class="mb-3">
                        <label for="unlock_after_days{{ $section->id }}" class="form-label">Unlock After Days (Optional)</label>
                        <input type="number" class="form-control" id="unlock_after_days{{ $section->id }}" name="unlock_after_days" min="0" value="{{ old('unlock_after_days', $section->unlock_after_days) }}">
                        <small class="text-muted">Number of days after enrollment before this section unlocks.</small>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="button -dark-1" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="button -md -blue-1 text-white">Update Section</button>
                </div>
            </form>
        </div>
    </div>
</div> 