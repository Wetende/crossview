<x-dashboard-layout>
    <div class="dashboard__content bg-light-4">
        <div class="row">
            <div class="col-12">
                <div class="row y-gap-20 justify-between items-end pb-30 mb-10">
                    <div class="col-auto">
                        <h1 class="text-30 lh-12 fw-700">Admin Profile Settings</h1>
                        <div class="mt-10">Manage your administrator profile and course creation settings.</div>
                    </div>
                </div>

                <div class="row y-gap-30">
                    <!-- Profile Settings -->
                    <div class="col-xl-8 col-lg-10">
                        <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                            <h2 class="text-20 lh-1 fw-500 mb-20">Profile Information</h2>
                            <p class="text-14 text-light-1 mb-30">Complete your profile to create courses with professional instructor information.</p>

                            @if(session('success'))
                                <div class="alert alert-success d-flex items-center py-15 px-20 rounded-8 bg-green-1 text-white mb-20">
                                    <i class="icon-check-circle text-16 mr-10"></i>
                                    {{ session('success') }}
                                </div>
                            @endif

                            <form action="{{ route('admin.profile.update') }}" method="POST" class="contact-form">
                                @csrf
                                <div class="row y-gap-20">
                                    <div class="col-md-6">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Full Name *</label>
                                        <input type="text" name="name" placeholder="Your Full Name" value="{{ old('name', $user->name) }}" required>
                                        @error('name')
                                            <div class="text-red-1 mt-1">{{ $message }}</div>
                                        @enderror
                                    </div>
                                    <div class="col-md-6">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Email Address *</label>
                                        <input type="email" name="email" placeholder="Your Email Address" value="{{ old('email', $user->email) }}" required>
                                        @error('email')
                                            <div class="text-red-1 mt-1">{{ $message }}</div>
                                        @enderror
                                    </div>
                                    <div class="col-md-6">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Phone Number</label>
                                        <input type="text" name="phone_number" placeholder="Your Phone Number" value="{{ old('phone_number', $user->phone_number) }}">
                                        @error('phone_number')
                                            <div class="text-red-1 mt-1">{{ $message }}</div>
                                        @enderror
                                    </div>
                                    <div class="col-md-6">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Position/Title</label>
                                        <input type="text" name="position" placeholder="e.g., Administrator, Educational Director" value="{{ old('position', $teacherProfile->position ?? '') }}">
                                        @error('position')
                                            <div class="text-red-1 mt-1">{{ $message }}</div>
                                        @enderror
                                    </div>
                                    <div class="col-md-6">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">School/Institution Affiliation</label>
                                        <input type="text" name="school_affiliation" placeholder="Your Institution or Organization" value="{{ old('school_affiliation', $teacherProfile->school_affiliation ?? '') }}">
                                        @error('school_affiliation')
                                            <div class="text-red-1 mt-1">{{ $message }}</div>
                                        @enderror
                                    </div>
                                    <div class="col-md-6">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Hourly Rate (Optional)</label>
                                        <input type="number" step="0.01" min="0" name="hourly_rate" placeholder="e.g., 50.00" value="{{ old('hourly_rate', $teacherProfile->hourly_rate ?? '') }}">
                                        @error('hourly_rate')
                                            <div class="text-red-1 mt-1">{{ $message }}</div>
                                        @enderror
                                    </div>
                                    <div class="col-12">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Professional Bio</label>
                                        <textarea name="bio" placeholder="Tell us about yourself, your experience, and expertise (minimum 50 characters)..." rows="5">{{ old('bio', $teacherProfile->bio ?? '') }}</textarea>
                                        @error('bio')
                                            <div class="text-red-1 mt-1">{{ $message }}</div>
                                        @enderror
                                    </div>
                                    <div class="col-12">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Qualifications & Certifications</label>
                                        <textarea name="qualifications" placeholder="Your educational qualifications, certifications, achievements, etc. (minimum 10 characters)..." rows="3">{{ old('qualifications', $teacherProfile->qualifications ?? '') }}</textarea>
                                        @error('qualifications')
                                            <div class="text-red-1 mt-1">{{ $message }}</div>
                                        @enderror
                                    </div>
                                    <div class="col-12">
                                        <div class="form-check d-flex items-center">
                                            <input type="checkbox" name="available_for_tutoring" id="available_for_tutoring" 
                                                   {{ old('available_for_tutoring', $teacherProfile->available_for_tutoring ?? false) ? 'checked' : '' }}>
                                            <label for="available_for_tutoring" class="text-14 fw-500 text-dark-1 ml-10">Available for tutoring sessions</label>
                                        </div>
                                    </div>
                                </div>

                                <div class="row y-gap-20 justify-between pt-30">
                                    <div class="col-auto">
                                        <button type="submit" class="button -md -purple-1 text-white">
                                            <i class="icon-save text-14 mr-10"></i>
                                            Update Profile
                                        </button>
                                    </div>
                                    <div class="col-auto">
                                        @if($teacherProfile && $teacherProfile->hasMinimumInfoForPublishing())
                                            <div class="d-flex items-center text-green-1">
                                                <i class="icon-check-circle text-16 mr-10"></i>
                                                <span class="text-14 fw-500">Profile Complete for Course Creation</span>
                                            </div>
                                        @else
                                            <div class="d-flex items-center text-orange-1">
                                                <i class="icon-info-circle text-16 mr-10"></i>
                                                <span class="text-14 fw-500">Complete bio or position + affiliation to create courses</span>
                                            </div>
                                        @endif
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- Password Change -->
                    <div class="col-xl-8 col-lg-10">
                        <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                            <h2 class="text-20 lh-1 fw-500 mb-20">Change Password</h2>
                            <p class="text-14 text-light-1 mb-30">Update your account password for security.</p>

                            <form action="{{ route('admin.profile.password.update') }}" method="POST" class="contact-form">
                                @csrf
                                <div class="row y-gap-20">
                                    <div class="col-12">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Current Password *</label>
                                        <input type="password" name="current_password" placeholder="Enter your current password" required>
                                        @error('current_password')
                                            <div class="text-red-1 mt-1">{{ $message }}</div>
                                        @enderror
                                    </div>
                                    <div class="col-md-6">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">New Password *</label>
                                        <input type="password" name="password" placeholder="Enter new password (min 8 characters)" required>
                                        @error('password')
                                            <div class="text-red-1 mt-1">{{ $message }}</div>
                                        @enderror
                                    </div>
                                    <div class="col-md-6">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Confirm New Password *</label>
                                        <input type="password" name="password_confirmation" placeholder="Confirm new password" required>
                                    </div>
                                </div>

                                <div class="row pt-30">
                                    <div class="col-auto">
                                        <button type="submit" class="button -md -red-1 text-white">
                                            <i class="icon-lock text-14 mr-10"></i>
                                            Update Password
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- Course Creation Status -->
                    <div class="col-xl-8 col-lg-10">
                        <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                            <h2 class="text-20 lh-1 fw-500 mb-20">Course Creation Status</h2>
                            
                            @if($teacherProfile)
                                <div class="row y-gap-15">
                                    <div class="col-12">
                                        <div class="d-flex items-center justify-between py-10 px-15 bg-light-3 -dark-bg-dark-2 rounded-8">
                                            <span class="text-14 fw-500">Profile Completeness</span>
                                            <span class="text-14 fw-700 text-purple-1">{{ $teacherProfile->getCompletenessPercentage() }}%</span>
                                        </div>
                                    </div>
                                    <div class="col-12">
                                        @if($teacherProfile->hasMinimumInfoForPublishing())
                                            <div class="alert alert-success d-flex items-center py-15 px-20 rounded-8 bg-green-1 text-white">
                                                <i class="icon-check-circle text-16 mr-10"></i>
                                                Your profile meets the requirements for course creation!
                                                <a href="{{ route('admin.teacher.courses.create') }}" class="button -sm -white text-green-1 ml-auto">
                                                    Create Course
                                                </a>
                                            </div>
                                        @else
                                            <div class="alert alert-warning d-flex items-center py-15 px-20 rounded-8 bg-orange-1 text-white">
                                                <i class="icon-info-circle text-16 mr-10"></i>
                                                Complete your profile to create courses. You need either:
                                                <ul class="mt-10 ml-20">
                                                    <li>A comprehensive bio (50+ characters), OR</li>
                                                    <li>Both position/title AND school affiliation</li>
                                                </ul>
                                            </div>
                                        @endif
                                    </div>
                                </div>
                            @else
                                <div class="alert alert-info d-flex items-center py-15 px-20 rounded-8 bg-blue-1 text-white">
                                    <i class="icon-info-circle text-16 mr-10"></i>
                                    Complete your profile above to enable course creation functionality.
                                </div>
                            @endif
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-dashboard-layout> 