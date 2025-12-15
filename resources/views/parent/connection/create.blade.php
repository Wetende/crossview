<x-dashboard-layout>
    <x-slot name="sidebar">
        @include('layouts.partials.parent.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.parent.header')
        <h1 class="text-30 lh-12 fw-700">Request Student Connection</h1>
        <div class="breadcrumbs mt-10 pt-0 pb-0">
            <div class="breadcrumbs__content">
                <div class="breadcrumbs__item">
                    <a href="{{ route('home') }}">Home</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('parent.overview') }}">Dashboard</a>
                </div>
                                <div class="breadcrumbs__item">                    <a href="{{ route('parent.connections.index') }}">Connections</a>                </div>
                <div class="breadcrumbs__item">
                    <a href="javascript:void(0);">Request Connection</a>
                </div>
            </div>
        </div>
    </x-slot>

    <div class="dashboard__content bg-light-4 py-30 px-30">
        {{-- Display validation errors --}}
        @if($errors->any())
            <div class="row mb-20">
                <div class="col-12">
                    <div class="alert alert-error bg-light-8 border-red-3 text-red-3">
                        <ul class="list-disc pl-20">
                            @foreach ($errors->all() as $error)
                                <li>{{ $error }}</li>
                            @endforeach
                        </ul>
                    </div>
                </div>
            </div>
        @endif

        {{-- Display success/error messages --}}
        @if(session('success'))
            <div class="row mb-20">
                <div class="col-12">
                    <div class="alert alert-success bg-light-9 border-success-3 text-success-3">
                        {{ session('success') }}
                    </div>
                </div>
            </div>
        @endif

        @if(session('error'))
            <div class="row mb-20">
                <div class="col-12">
                    <div class="alert alert-error bg-light-8 border-red-3 text-red-3">
                        {{ session('error') }}
                    </div>
                </div>
            </div>
        @endif

        <div class="row justify-center">
            <div class="col-xl-8 col-lg-10">
                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <h3 class="text-20 lh-1 fw-500 mb-30">Request Connection to a Student</h3>
                    
                    <div class="mt-10 mb-30">
                        <div class="bg-light-3 -dark-bg-dark-2 text-14 py-15 px-20 rounded-8">
                            <p><strong>Note:</strong> Use this form to request a connection with your child's account. The student will receive an email notification and will need to approve your request.</p>
                            <p class="mt-10 mb-0">If you have a connection code provided by the student, you can <a href="{{ route('parent.link.create') }}" class="text-purple-1 underline">enter it here</a> instead.</p>
                        </div>
                    </div>
                    
                    <form action="{{ route('parent.connections.store') }}" method="POST" class="contact-form row y-gap-30">
                        @csrf
                        
                        <div class="col-12">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Enter Student's Email Address</label>
                            <input type="email" name="student_email" placeholder="student@example.com" value="{{ old('student_email') }}" required>
                            <div class="text-14 mt-5 text-light-1">The student will be notified and must approve your request.</div>
                        </div>
                        
                                                <div class="col-12 mt-10">                            <button type="submit" class="button -md -purple-1 text-white">Send Connection Request</button>                            <a href="{{ route('parent.connections.index') }}" class="button -md -light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white ml-10">Cancel</a>                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</x-dashboard-layout> 