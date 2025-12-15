<x-dashboard-layout>
    <x-slot name="title">Settings</x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.parent.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.parent.header')
    </x-slot>

    {{-- Adapted content from dshb-settings.html --}}
    <div class="row y-gap-30">
        <div class="col-12">
            <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                <div class="tabs -active-purple-2 js-tabs pt-0">
                    <div class="tabs__controls d-flex x-gap-30 items-center pt-20 px-30 border-bottom-light js-tabs-controls">
                        <button class="tabs__button text-light-1 js-tabs-button is-active" data-tab-target=".-tab-item-1" type="button">
                            Edit Profile
                        </button>
                        <button class="tabs__button text-light-1 js-tabs-button" data-tab-target=".-tab-item-2" type="button">
                            Password
                        </button>
                        <button class="tabs__button text-light-1 js-tabs-button" data-tab-target=".-tab-item-3" type="button">
                            Notification Settings
                        </button>
                         <button class="tabs__button text-light-1 js-tabs-button" data-tab-target=".-tab-item-4" type="button">
                            Close Account
                        </button>
                    </div>

                    <div class="tabs__content py-30 px-30 js-tabs-content">
                        {{-- Tab 1: Edit Profile --}}
                        <div class="tabs__pane -tab-item-1 is-active">
                            <div class="row y-gap-20 x-gap-20 items-center">
                                <div class="col-auto">
                                    <img class="size-100" src="{{ asset('img/dashboard/edit/1.png') }}" alt="image">
                                </div>
                                <div class="col-auto">
                                    <div class="text-16 fw-500 text-dark-1">Your avatar</div>
                                    <div class="text-14 lh-1 mt-10">PNG or JPG no bigger than 800px wide and tall.</div>
                                    <div class="d-flex x-gap-10 y-gap-10 flex-wrap pt-15">
                                        <div><button class="button -sm -purple-1 text-white">Upload</button></div>
                                        <div><button class="button -sm -light-1 text-dark-1">Delete</button></div>
                                    </div>
                                </div>
                            </div>

                            <div class="border-top-light pt-30 mt-30">
                                <form action="#" class="contact-form row y-gap-30"> {{-- Update action --}}
                                    @csrf
                                    <div class="col-md-6">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">First Name*</label>
                                        <input type="text" name="first_name" placeholder="First Name" value="{{ auth()->user()->first_name ?? '' }}">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Last Name*</label>
                                        <input type="text" name="last_name" placeholder="Last Name" value="{{ auth()->user()->last_name ?? '' }}">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Email*</label>
                                        <input type="email" name="email" placeholder="Email" value="{{ auth()->user()->email ?? '' }}">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Phone Number</label>
                                        <input type="text" name="phone" placeholder="Phone Number">
                                    </div>
                                    <div class="col-12">
                                        <button class="button -md -purple-1 text-white">Save Changes</button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {{-- Tab 2: Password --}}
                        <div class="tabs__pane -tab-item-2">
                            <form action="#" class="contact-form row y-gap-30"> {{-- Update action --}}
                                @csrf
                                <div class="col-md-7">
                                    <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Current Password</label>
                                    <input type="password" name="current_password" placeholder="********">
                                </div>
                                <div class="col-md-7">
                                    <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">New Password</label>
                                    <input type="password" name="new_password" placeholder="********">
                                </div>
                                <div class="col-md-7">
                                    <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Confirm New Password</label>
                                    <input type="password" name="new_password_confirmation" placeholder="********">
                                </div>
                                <div class="col-12">
                                    <button class="button -md -purple-1 text-white">Change Password</button>
                                </div>
                            </form>
                        </div>

                        {{-- Tab 3: Notification Settings --}}
                        <div class="tabs__pane -tab-item-3">
                           <h4 class="text-18 lh-12 fw-500">Notification Preferences</h4>
                           <div class="pt-20 y-gap-20">
                                <div class="d-flex items-center justify-between border-bottom-light pb-15">
                                    <div>
                                        <h5 class="text-15 lh-12 fw-500">Email Notifications</h5>
                                        <p class="text-14 lh-1 text-light-1 mt-5">Receive emails about child's progress, new messages, and important updates.</p>
                                    </div>
                                    <div class="form-switch">
                                        <input type="checkbox" checked> {{-- Bind this to user preference --}}
                                        <div class="form-switch__slider round"></div>
                                    </div>
                                </div>
                               <div class="d-flex items-center justify-between border-bottom-light py-15">
                                    <div>
                                        <h5 class="text-15 lh-12 fw-500">Child Activity Reports</h5>
                                        <p class="text-14 lh-1 text-light-1 mt-5">Get weekly summaries of your child's learning activity.</p>
                                    </div>
                                    <div class="form-switch">
                                        <input type="checkbox"> {{-- Bind this to user preference --}}
                                        <div class="form-switch__slider round"></div>
                                    </div>
                                </div>
                                <div class="d-flex items-center justify-between pt-15">
                                    <div>
                                        <h5 class="text-15 lh-12 fw-500">Promotional Updates</h5>
                                        <p class="text-14 lh-1 text-light-1 mt-5">Receive information about new courses and special offers.</p>
                                    </div>
                                    <div class="form-switch">
                                        <input type="checkbox" checked> {{-- Bind this to user preference --}}
                                        <div class="form-switch__slider round"></div>
                                    </div>
                                </div>
                                <div class="col-12 mt-30">
                                    <button class="button -md -purple-1 text-white">Save Notification Settings</button>
                                </div>
                           </div>
                        </div>

                        {{-- Tab 4: Close Account --}}
                        <div class="tabs__pane -tab-item-4">
                            <h4 class="text-18 lh-12 fw-500 text-red-1">Close Account</h4>
                            <div class="pt-20">Closing your account is irreversible. All your data, including your child's progress linked to this account, will be permanently deleted.</div>
                            <form action="#" method="POST" class="mt-20"> {{-- Update action --}}
                                @csrf
                                @method('DELETE')
                                <button class="button -md -red-1 text-white">Close My Account</button>
                            </form>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    </div>
</x-dashboard-layout> 