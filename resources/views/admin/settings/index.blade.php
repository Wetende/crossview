<x-dashboard-layout>
    <x-slot name="sidebar">
        @include('layouts.partials.admin.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.admin.header')
    </x-slot>

    <div class="dashboard__content bg-light-4 py-30 px-30">
        <div class="row y-gap-20 justify-between items-end pb-20 lg:pb-40 md:pb-32">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">Platform Settings</h1>
                <div class="text-15 text-light-1">Configure various aspects of the learning platform.</div>
            </div>
        </div>

        <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4">
            <div class="tabs -underline-2 js-tabs">
                <div class="tabs__controls py-20 px-30 js-tabs-controls">
                    <button class="tabs__button text-14 lh-12 fw-500 text-light-1 js-tabs-button is-active" data-tab-target=".-tab-item-1" type="button">Site Settings</button>
                    <button class="tabs__button text-14 lh-12 fw-500 text-light-1 js-tabs-button ml-30" data-tab-target=".-tab-item-2" type="button">User & Roles</button>
                    <button class="tabs__button text-14 lh-12 fw-500 text-light-1 js-tabs-button ml-30" data-tab-target=".-tab-item-3" type="button">Payment Gateways</button>
                    <button class="tabs__button text-14 lh-12 fw-500 text-light-1 js-tabs-button ml-30" data-tab-target=".-tab-item-4" type="button">Email Configuration</button>
                    <button class="tabs__button text-14 lh-12 fw-500 text-light-1 js-tabs-button ml-30" data-tab-target=".-tab-item-5" type="button">Appearance</button>
                    <button class="tabs__button text-14 lh-12 fw-500 text-light-1 js-tabs-button ml-30" data-tab-target=".-tab-item-6" type="button">Security</button>
                </div>

                <div class="tabs__content py-30 px-30 js-tabs-content">
                    {{-- Tab 1: Site Settings --}}
                    <div class="tabs__pane -tab-item-1 is-active">
                        <h5 class="text-16 fw-500 mb-30">General Site Settings</h5>
                        <form class="contact-form row y-gap-30">
                            <div class="col-md-6">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Site Name</label>
                                <input type="text" name="site_name" placeholder="{{ config('app.name') }}" value="{{-- old('site_name', $settings->site_name ?? '') --}}">
                            </div>
                            <div class="col-md-6">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Site Tagline</label>
                                <input type="text" name="site_tagline" placeholder="Your Learning Journey Starts Here" value="{{-- old('site_tagline', $settings->site_tagline ?? '') --}}">
                            </div>
                            <div class="col-md-6">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Admin Email</label>
                                <input type="email" name="admin_email" placeholder="admin@example.com" value="{{-- old('admin_email', $settings->admin_email ?? '') --}}">
                            </div>
                            <div class="col-md-6">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Site Language</label>
                                <select name="site_language" class="selectize-singular">
                                    <option value="en">English</option>
                                    {{-- Add other languages --}}
                                </select>
                            </div>
                            <div class="col-12">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Site Logo</label>
                                {{-- <img src="{{ asset($settings->logo_path ?? 'img/general/logo.svg') }}" alt="logo" class="mb-10" style="max-height: 50px;"> --}}
                                <input type="file" name="site_logo">
                                <p class="mt-10 text-13">Recommended size: 200x50px. PNG or SVG.</p>
                            </div>
                             <div class="col-12">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Maintenance Mode</label>
                                <div class="form-switch d-flex items-center">
                                    <div class="switch">
                                        <input type="checkbox" name="maintenance_mode" {{-- ($settings->maintenance_mode ?? false) ? 'checked' : '' --}}>
                                        <span class="switch__slider"></span>
                                    </div>
                                    <div class="text-13 lh-1 text-dark-1 ml-10">Enable Maintenance Mode</div>
                                </div>
                            </div>
                            <div class="col-12">
                                <button type="submit" class="button -md -purple-1 text-white">Save Site Settings</button>
                            </div>
                        </form>
                    </div>

                    {{-- Tab 2: User & Roles Settings --}}
                    <div class="tabs__pane -tab-item-2">
                        <h5 class="text-16 fw-500 mb-30">User and Role Management Settings</h5>
                        <form class="contact-form row y-gap-30">
                            <div class="col-md-6">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Default Role for New Users</label>
                                <select name="default_role" class="selectize-singular">
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher (Requires Approval)</option>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Enable Public Registration</label>
                                 <div class="form-switch d-flex items-center">
                                    <div class="switch">
                                        <input type="checkbox" name="enable_registration" checked>
                                        <span class="switch__slider"></span>
                                    </div>
                                </div>
                            </div>
                             <div class="col-md-6">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Require Email Verification</label>
                                 <div class="form-switch d-flex items-center">
                                    <div class="switch">
                                        <input type="checkbox" name="require_email_verification" checked>
                                        <span class="switch__slider"></span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-12">
                                <button type="submit" class="button -md -purple-1 text-white">Save User Settings</button>
                            </div>
                        </form>
                    </div>

                    {{-- Tab 3: Payment Gateways --}}
                    <div class="tabs__pane -tab-item-3">
                        <h5 class="text-16 fw-500 mb-30">Payment Gateway Configuration</h5>
                        {{-- Stripe Settings Example --}}
                        <h6>Stripe</h6>
                        <form class="contact-form row y-gap-30 mt-10">
                            <div class="col-md-6">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Stripe Publishable Key</label>
                                <input type="text" name="stripe_publishable_key" placeholder="pk_live_...">
                            </div>
                            <div class="col-md-6">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Stripe Secret Key</label>
                                <input type="password" name="stripe_secret_key" placeholder="sk_live_...">
                            </div>
                            <div class="col-12">
                                <button type="submit" class="button -md -purple-1 text-white">Save Stripe Settings</button>
                            </div>
                        </form>
                        {{-- PayPal Settings Example --}}
                        <h6 class="mt-30">PayPal</h6>
                         <form class="contact-form row y-gap-30 mt-10">
                            <div class="col-md-6">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">PayPal Client ID</label>
                                <input type="text" name="paypal_client_id" placeholder="...">
                            </div>
                            <div class="col-md-6">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">PayPal Client Secret</label>
                                <input type="password" name="paypal_client_secret" placeholder="...">
                            </div>
                            <div class="col-12">
                                <button type="submit" class="button -md -purple-1 text-white">Save PayPal Settings</button>
                            </div>
                        </form>
                    </div>

                    {{-- Tab 4: Email Configuration --}}
                    <div class="tabs__pane -tab-item-4">
                        <h5 class="text-16 fw-500 mb-30">Email Settings</h5>
                        <form class="contact-form row y-gap-30">
                            <div class="col-md-6">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Mail Driver</label>
                                <select name="mail_driver" class="selectize-singular">
                                    <option value="smtp">SMTP</option>
                                    <option value="sendmail">Sendmail</option>
                                    <option value="log">Log (for testing)</option>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">From Email Address</label>
                                <input type="email" name="mail_from_address" placeholder="noreply@example.com">
                            </div>
                             <div class="col-md-6">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">From Name</label>
                                <input type="text" name="mail_from_name" placeholder="{{ config('app.name') }}">
                            </div>
                            {{-- SMTP Specific fields would go here, conditionally shown --}}
                            <div class="col-12">
                                <button type="submit" class="button -md -purple-1 text-white">Save Email Settings</button>
                            </div>
                        </form>
                    </div>

                    {{-- Tab 5: Appearance --}}
                    <div class="tabs__pane -tab-item-5">
                        <h5 class="text-16 fw-500 mb-30">Appearance & Customization</h5>
                         <form class="contact-form row y-gap-30">
                            <div class="col-md-6">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Theme Color</label>
                                <input type="color" name="theme_color" value="#7755A4"> {{-- Default purple from Crossview College --}}
                            </div>
                             <div class="col-12">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Custom CSS</label>
                                <textarea name="custom_css" rows="10" placeholder=".custom-class { color: red; }"></textarea>
                            </div>
                            <div class="col-12">
                                <button type="submit" class="button -md -purple-1 text-white">Save Appearance Settings</button>
                            </div>
                        </form>
                    </div>

                    {{-- Tab 6: Security --}}
                    <div class="tabs__pane -tab-item-6">
                        <h5 class="text-16 fw-500 mb-30">Security Settings</h5>
                        <form class="contact-form row y-gap-30">
                            <div class="col-md-6">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Enable Two-Factor Authentication (2FA)</label>
                                 <div class="form-switch d-flex items-center">
                                    <div class="switch">
                                        <input type="checkbox" name="enable_2fa">
                                        <span class="switch__slider"></span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">reCAPTCHA Site Key</label>
                                <input type="text" name="recaptcha_site_key" placeholder="Site Key">
                            </div>
                            <div class="col-md-6">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">reCAPTCHA Secret Key</label>
                                <input type="password" name="recaptcha_secret_key" placeholder="Secret Key">
                            </div>
                            <div class="col-12">
                                <button type="submit" class="button -md -purple-1 text-white">Save Security Settings</button>
                            </div>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    </div>
</x-dashboard-layout> 