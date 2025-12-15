<!-- Add Section Modal -->
<div class="modal fade" id="addSectionModal" tabindex="-1" aria-labelledby="addSectionModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <form action="{{ route('teacher.courses.sections.store', $course) }}" method="POST">
                @csrf
                <div class="modal-header">
                    <h5 class="modal-title" id="addSectionModalLabel">Add New Section</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label for="title" class="form-label">Section Title</label>
                        <input type="text" class="form-control" id="title" name="title" required>
                    </div>
                    <div class="mb-3">
                        <label for="description" class="form-label">Description (Optional)</label>
                        <textarea class="form-control" id="description" name="description" rows="3"></textarea>
                    </div>
                    <div class="mb-3">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="is_published" name="is_published" value="1" checked>
                            <label class="form-check-label" for="is_published">
                                Publish this section
                            </label>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label for="unlock_date" class="form-label">Unlock Date (Optional)</label>
                        <input type="datetime-local" class="form-control" id="unlock_date" name="unlock_date">
                        <small class="text-muted">Leave empty to make available immediately.</small>
                    </div>
                    <div class="mb-3">
                        <label for="unlock_after_days" class="form-label">Unlock After Days (Optional)</label>
                        <input type="number" class="form-control" id="unlock_after_days" name="unlock_after_days" min="0">
                        <small class="text-muted">Number of days after enrollment before this section unlocks.</small>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="button -dark-1" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="button -md -blue-1 text-white">Add Section</button>
                </div>
            </form>
        </div>
    </div>
</div> 