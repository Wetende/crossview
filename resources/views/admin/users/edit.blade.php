<x-dashboard-layout>
    <x-slot name="sidebar">
        @include('layouts.partials.admin.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.admin.header')
    </x-slot>

    <div class="dashboard__content bg-light-4 py-6 px-4 md:px-8">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-10">
            <div>
                <h1 class="text-2xl font-bold text-dark-1">Edit User</h1>
                <p class="text-gray-500 mt-1">Update user information and roles.</p>
            </div>
            <a href="{{ route('admin.users.index') }}" class="button -md -outline-purple-1 text-purple-1 mt-4 md:mt-0">
                <i class="icon-arrow-left mr-2"></i>Back to Users
            </a>
        </div>

        <div class="bg-white rounded-2xl shadow px-6 py-8">
            <form action="{{ route('admin.users.update', $user->id) }}" method="POST" enctype="multipart/form-data" class="grid gap-6 md:grid-cols-2">
                @csrf
                @method('PUT')

                {{-- Profile Picture Upload --}}
                <div class="md:col-span-2">
                    <div class="flex items-center space-x-6">
                        <div id="preview" class="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                            @if($user->profile_picture_path)
                                <img src="{{ asset('storage/' . $user->profile_picture_path) }}" alt="{{ $user->name }}" class="w-full h-full object-cover">
                            @else
                                <i class="icon-user-2 text-gray-400 text-2xl"></i>
                            @endif
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-dark-1 mb-2">Profile Picture</label>
                            <div class="flex items-center space-x-3">
                                <input type="file" id="profile_picture" name="profile_picture" accept="image/*" class="hidden">
                                <label for="profile_picture" class="button -sm -outline-purple-1 text-purple-1 cursor-pointer">Choose File</label>
                                <span id="filename" class="text-sm text-gray-500">No file chosen</span>
                            </div>
                            @error('profile_picture')
                                <div class="text-red-500 mt-1 text-sm">{{ $message }}</div>
                            @enderror
                        </div>
                    </div>
                </div>

                {{-- Name --}}
                <div>
                    <label class="text-sm font-medium text-dark-1 mb-1 block">Full Name*</label>
                    <input type="text" name="name" placeholder="Enter full name" value="{{ old('name', $user->name) }}" required class="form-input w-full">
                    @error('name')
                        <div class="text-red-500 mt-1 text-sm">{{ $message }}</div>
                    @enderror
                </div>

                {{-- Email --}}
                <div>
                    <label class="text-sm font-medium text-dark-1 mb-1 block">Email Address*</label>
                    <input type="email" name="email" placeholder="Enter email address" value="{{ old('email', $user->email) }}" required class="form-input w-full">
                    @error('email')
                        <div class="text-red-500 mt-1 text-sm">{{ $message }}</div>
                    @enderror
                </div>

                {{-- Password --}}
                <div>
                    <label class="text-sm font-medium text-dark-1 mb-1 block">Password <span class="text-xs text-gray-400">(Leave blank to keep current)</span></label>
                    <input type="password" name="password" placeholder="Enter new password" class="form-input w-full">
                    @error('password')
                        <div class="text-red-500 mt-1 text-sm">{{ $message }}</div>
                    @enderror
                </div>

                {{-- Confirm Password --}}
                <div>
                    <label class="text-sm font-medium text-dark-1 mb-1 block">Confirm Password</label>
                    <input type="password" name="password_confirmation" placeholder="Confirm new password" class="form-input w-full">
                </div>

                {{-- Roles --}}
                <div class="md:col-span-2">
                    <label class="text-sm font-medium text-dark-1 mb-1 block">Roles*</label>
                    <div class="flex flex-wrap gap-4">
                        @foreach($roles as $role)
                            <label class="inline-flex items-center space-x-2">
                                <input type="checkbox" name="roles[]" value="{{ $role->id }}" id="role-{{ $role->id }}"
                                    {{ in_array($role->id, old('roles', $user->roles->pluck('id')->toArray())) ? 'checked' : '' }} class="form-checkbox">
                                <span class="text-sm">{{ ucfirst($role->name) }}</span>
                            </label>
                        @endforeach
                    </div>
                    @error('roles')
                        <div class="text-red-500 mt-1 text-sm">{{ $message }}</div>
                    @enderror
                </div>

                {{-- Active Checkbox --}}
                <div class="md:col-span-2">
                    <label class="inline-flex items-center space-x-2">
                        <input type="checkbox" name="is_active" value="1" id="is_active" {{ old('is_active', $user->is_active) ? 'checked' : '' }} class="form-checkbox">
                        <span class="text-sm">Account Active</span>
                    </label>
                </div>

                {{-- Actions --}}
                <div class="md:col-span-2 border-t pt-6 mt-4 flex flex-col sm:flex-row justify-between gap-4">
                    <button type="button" onclick="window.location.href='{{ route('admin.users.index') }}'" class="button -md -outline-red-1 text-red-1 w-full sm:w-auto">
                        Cancel
                    </button>
                    <button type="submit" class="button -md -purple-1 text-white w-full sm:w-auto">
                        Update User
                    </button>
                </div>
            </form>
        </div>
    </div>

    @push('scripts')
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const profileInput = document.getElementById('profile_picture');
            const filenameDisplay = document.getElementById('filename');
            const preview = document.getElementById('preview');

            profileInput.addEventListener('change', function() {
                const file = this.files[0];
                if (file) {
                    filenameDisplay.textContent = file.name;

                    const reader = new FileReader();
                    reader.onload = function(e) {
                        preview.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover">`;
                    };
                    reader.readAsDataURL(file);
                } else {
                    filenameDisplay.textContent = 'No file chosen';
                    preview.innerHTML = '<i class="icon-user-2 text-gray-400 text-2xl"></i>';
                }
            });
        });
    </script>
    @endpush
</x-dashboard-layout>
