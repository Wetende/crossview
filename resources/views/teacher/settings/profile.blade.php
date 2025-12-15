<x-dashboard-layout title="Teacher Dashboard - Settings">
    <x-slot name="sidebar">
        @include('layouts.partials.teacher.sidebar')
    </x-slot>
    <x-slot name="header">
        @include('layouts.partials.teacher.header')
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row pb-50 mb-10">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">Settings</h1>
                <div class="text-15 lh-12 fw-500 text-dark-1 mt-5">Manage your profile, payment details, and other preferences.</div>
            </div>
        </div>

        @if(session('success'))
            <div class="alert -success mb-30">
                <div class="alert__content">{{ session('success') }}</div>
            </div>
        @endif

        @if(session('error'))
            <div class="alert -danger mb-30">
                <div class="alert__content">{{ session('error') }}</div>
            </div>
        @endif

        {{-- Profile Completeness Indicator --}}
        @if($teacherProfile)
            @php
                $completeness = $teacherProfile->getCompletenessPercentage();
                $hasMinimumInfo = $teacherProfile->hasMinimumInfoForPublishing();
                $missingFields = $teacherProfile->getMissingFields();
                $fieldNames = $teacherProfile->getFieldDisplayNames();
            @endphp
            
            <div class="row y-gap-20 mb-30">
                <div class="col-12">
                    <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 py-20 px-30">
                        <div class="d-flex items-center justify-between">
                            <div>
                                <h3 class="text-18 fw-500 text-dark-1">Profile Completeness</h3>
                                <div class="text-14 text-light-1 mt-5">
                                    @if($hasMinimumInfo)
                                        <span class="text-green-1">✓ Your profile meets the minimum requirements for creating courses</span>
                                    @else
                                        <span class="text-orange-1">⚠ Complete your profile to create and publish courses</span>
                                    @endif
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-24 fw-700 text-purple-1">{{ $completeness }}%</div>
                                <div class="text-12 text-light-1">Complete</div>
                            </div>
                        </div>
                        
                        <div class="mt-15">
                            <div class="bg-light-3 rounded-8" style="height: 8px; position: relative;">
                                <div class="bg-purple-1 rounded-8" style="width: {{ $completeness }}%; height: 100%;">
                                </div>
                                <span class="text-12 fw-500 text-purple-1" style="position: absolute; right: 0; top: -20px;">{{ $completeness }}%</span>
                            </div>
                        </div>
                        
                        @if(!$hasMinimumInfo && count($missingFields) > 0)
                            <div class="mt-15 p-15 bg-light-6 rounded-8">
                                <div class="text-14 fw-500 text-dark-1 mb-5">To create courses, please complete:</div>
                                <ul class="text-13 text-light-1">
                                    @foreach($missingFields as $field)
                                        <li>• {{ $fieldNames[$field] ?? ucfirst($field) }}</li>
                                    @endforeach
                                </ul>
                                <div class="text-12 text-light-1 mt-5 italic">
                                    OR provide a comprehensive bio (at least 50 characters)
                                </div>
                            </div>
                        @endif
                    </div>
                </div>
            </div>
        @endif

        <div class="row y-gap-30">
            <div class="col-12">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div class="tabs -underline-2 js-tabs">
                        <div class="tabs__controls row x-gap-40 y-gap-10 lg:x-gap-20 py-30 px-30 js-tabs-controls">
                            <div class="col-auto">
                                <button class="tabs__button text-18 lh-1 fw-500 text-light-1 pb-8 js-tabs-button is-active" data-tab-target=".-tab-item-1" type="button">
                                    Edit Profile
                                </button>
                            </div>
                            <div class="col-auto">
                                <button class="tabs__button text-18 lh-1 fw-500 text-light-1 pb-8 js-tabs-button" data-tab-target=".-tab-item-2" type="button">
                                    Password
                                </button>
                            </div>
                            <div class="col-auto">
                                <button class="tabs__button text-18 lh-1 fw-500 text-light-1 pb-8 js-tabs-button" data-tab-target=".-tab-item-3" type="button">
                                    Payment Details
                                </button>
                            </div>
                            <div class="col-auto">
                                <button class="tabs__button text-18 lh-1 fw-500 text-light-1 pb-8 js-tabs-button" data-tab-target=".-tab-item-4" type="button">
                                    Notifications
                                </button>
                            </div>
                        </div>

                        <div class="tabs__content py-30 px-30 js-tabs-content">
                            {{-- Tab 1: Edit Profile --}}
                            <div class="tabs__pane -tab-item-1 is-active">
                                <form action="{{ route('teacher.profile.update') }}" method="POST" class="row y-gap-30 contact-form">
                                    @csrf
                                    @method('PUT')
                                    <div class="col-md-6">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Full Name*</label>
                                        <input type="text" name="name" placeholder="Your Full Name" value="{{ Auth::user()->name ?? '' }}">
                                        @error('name')
                                            <div class="text-red-1 mt-1">{{ $message }}</div>
                                        @enderror
                                    </div>
                                    <div class="col-md-6">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Email*</label>
                                        <input type="email" name="email" placeholder="Your Email Address" value="{{ Auth::user()->email ?? '' }}">
                                        @error('email')
                                            <div class="text-red-1 mt-1">{{ $message }}</div>
                                        @enderror
                                    </div>
                                    <div class="col-md-6">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Phone Number</label>
                                        <input type="text" name="phone_number" placeholder="Your Phone Number" value="{{ Auth::user()->phone_number ?? '' }}">
                                        @error('phone_number')
                                            <div class="text-red-1 mt-1">{{ $message }}</div>
                                        @enderror
                                    </div>
                                    <div class="col-md-6">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Position/Title</label>
                                        <input type="text" name="position" placeholder="e.g., Math Teacher, Science Instructor" value="{{ $teacherProfile->position ?? '' }}">
                                        @error('position')
                                            <div class="text-red-1 mt-1">{{ $message }}</div>
                                        @enderror
                                    </div>
                                    <div class="col-md-6">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">School Affiliation</label>
                                        <input type="text" name="school_affiliation" placeholder="Your School or Institution" value="{{ $teacherProfile->school_affiliation ?? '' }}">
                                        @error('school_affiliation')
                                            <div class="text-red-1 mt-1">{{ $message }}</div>
                                        @enderror
                                    </div>
                                    <div class="col-md-6">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Hourly Rate (for tutoring)</label>
                                        <input type="number" step="0.01" min="0" name="hourly_rate" placeholder="e.g., 25.00" value="{{ $teacherProfile->hourly_rate ?? '' }}">
                                        @error('hourly_rate')
                                            <div class="text-red-1 mt-1">{{ $message }}</div>
                                        @enderror
                                    </div>
                                    <div class="col-12">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Bio</label>
                                        <textarea name="bio" placeholder="Tell us about yourself..." rows="5">{{ $teacherProfile->bio ?? '' }}</textarea>
                                        @error('bio')
                                            <div class="text-red-1 mt-1">{{ $message }}</div>
                                        @enderror
                                    </div>
                                    <div class="col-12">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Qualifications</label>
                                        <textarea name="qualifications" placeholder="Your educational qualifications, certifications, etc." rows="3">{{ $teacherProfile->qualifications ?? '' }}</textarea>
                                        @error('qualifications')
                                            <div class="text-red-1 mt-1">{{ $message }}</div>
                                        @enderror
                                    </div>
                                    <div class="col-12">
                                        <div class="form-switch d-flex items-center">
                                            <div class="switch">
                                                <input type="checkbox" name="available_for_tutoring" {{ ($teacherProfile && $teacherProfile->available_for_tutoring) ? 'checked' : '' }}>
                                                <span class="switch__slider"></span>
                                            </div>
                                            <div class="text-15 lh-1 text-dark-1 ml-10">Available for private tutoring</div>
                                        </div>
                                    </div>
                                    <div class="col-12">
                                        <button class="button -md -purple-1 text-white" type="submit">Update Profile</button>
                                    </div>
                                </form>
                            </div>

                            {{-- Tab 2: Password --}}
                            <div class="tabs__pane -tab-item-2">
                                <form action="{{ route('teacher.password.update') }}" method="POST" class="row y-gap-30 contact-form">
                                    @csrf
                                    @method('PUT')
                                    <div class="col-md-7">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Current Password</label>
                                        <input type="password" name="current_password" placeholder="********">
                                        @error('current_password')
                                            <div class="text-red-1 mt-1">{{ $message }}</div>
                                        @enderror
                                    </div>
                                    <div class="col-md-7">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">New Password</label>
                                        <input type="password" name="password" placeholder="********">
                                        @error('password')
                                            <div class="text-red-1 mt-1">{{ $message }}</div>
                                        @enderror
                                    </div>
                                    <div class="col-md-7">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Confirm New Password</label>
                                        <input type="password" name="password_confirmation" placeholder="********">
                                    </div>
                                    <div class="col-12">
                                        <button class="button -md -purple-1 text-white" type="submit">Save Password</button>
                                    </div>
                                </form>
                            </div>

                            {{-- Tab 3: Payment Details --}}
                            <div class="tabs__pane -tab-item-3">
                                <div class="mb-20">
                                    <p class="text-16 mb-10">Manage your payment details for receiving payouts. You can add and update your payment information here.</p>
                                    <a href="{{ route('teacher.payment-details.index') }}" class="button -md -purple-1 text-white">
                                        {{ $hasPaymentDetails ? 'Manage Payment Details' : 'Add Payment Details' }}
                                    </a>
                                </div>
                                
                                @if($hasPaymentDetails)
                                <div class="mt-30 pt-30 border-top-light">
                                    <h3 class="text-18 fw-500 mb-15">Current Payment Method</h3>
                                    <div class="d-flex items-center">
                                        <div class="icon-payment-{{ $paymentDetail->payment_method }} text-24 mr-15"></div>
                                        <div>
                                            <h5 class="text-16 fw-500">{{ ucfirst(str_replace('_', ' ', $paymentDetail->payment_method)) }}</h5>
                                            <p class="text-14 mt-5">
                                                @if($paymentDetail->payment_method === 'bank_transfer')
                                                    {{ $paymentDetail->getAccountDetail('bank_name') }} - Account ending in {{ substr($paymentDetail->getAccountDetail('account_number'), -4) }}
                                                @elseif($paymentDetail->payment_method === 'mobile_money')
                                                    {{ ucfirst($paymentDetail->getAccountDetail('provider')) }} - {{ $paymentDetail->getAccountDetail('phone_number') }}
                                                @elseif($paymentDetail->payment_method === 'paypal')
                                                    {{ $paymentDetail->getAccountDetail('paypal_email') }}
                                                @endif
                                            </p>
                                            <div class="badge {{ $paymentDetail->isPending() ? 'bg-orange-1' : ($paymentDetail->isVerified() ? 'bg-green-1' : 'bg-red-1') }} text-white mt-10">
                                                {{ ucfirst($paymentDetail->status) }}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                @endif
                            </div>

                            {{-- Tab 4: Notifications --}}
                            <div class="tabs__pane -tab-item-4">
                                <form action="{{ route('teacher.notification-settings.update') }}" method="POST" class="row y-gap-20 contact-form">
                                    @csrf
                                    @method('PUT')
                                    <div class="col-12">
                                        <h3 class="text-18 fw-500 mb-15">Email Notifications</h3>
                                    </div>
                                    
                                    <div class="col-12">
                                        <div class="form-switch d-flex items-center">
                                            <div class="switch">
                                                <input type="checkbox" name="notifications[new_enrollment]" {{ isset($notificationPreferences['new_enrollment']) && $notificationPreferences['new_enrollment'] ? 'checked' : '' }}>
                                                <span class="switch__slider"></span>
                                            </div>
                                            <div class="text-15 lh-1 text-dark-1 ml-10">Email me for new student enrollments</div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-12">
                                        <div class="form-switch d-flex items-center mt-15">
                                            <div class="switch">
                                                <input type="checkbox" name="notifications[assignment_submission]" {{ isset($notificationPreferences['assignment_submission']) && $notificationPreferences['assignment_submission'] ? 'checked' : '' }}>
                                                <span class="switch__slider"></span>
                                            </div>
                                            <div class="text-15 lh-1 text-dark-1 ml-10">Email me when an assignment is submitted</div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-12">
                                        <div class="form-switch d-flex items-center mt-15">
                                            <div class="switch">
                                                <input type="checkbox" name="notifications[new_review]" {{ isset($notificationPreferences['new_review']) && $notificationPreferences['new_review'] ? 'checked' : '' }}>
                                                <span class="switch__slider"></span>
                                            </div>
                                            <div class="text-15 lh-1 text-dark-1 ml-10">Email me when a student leaves a new review</div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-12">
                                        <div class="form-switch d-flex items-center mt-15">
                                            <div class="switch">
                                                <input type="checkbox" name="notifications[course_purchase]" {{ isset($notificationPreferences['course_purchase']) && $notificationPreferences['course_purchase'] ? 'checked' : '' }}>
                                                <span class="switch__slider"></span>
                                            </div>
                                            <div class="text-15 lh-1 text-dark-1 ml-10">Email me when a course is purchased</div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-12">
                                        <div class="form-switch d-flex items-center mt-15">
                                            <div class="switch">
                                                <input type="checkbox" name="notifications[payment_processed]" {{ isset($notificationPreferences['payment_processed']) && $notificationPreferences['payment_processed'] ? 'checked' : '' }}>
                                                <span class="switch__slider"></span>
                                            </div>
                                            <div class="text-15 lh-1 text-dark-1 ml-10">Email me when a payment is processed</div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-12 mt-20">
                                        <button class="button -md -purple-1 text-white" type="submit">Save Notification Settings</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-dashboard-layout> 