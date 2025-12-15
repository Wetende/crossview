<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ $title ?? config('app.name', 'Laravel') }}</title>

    <!-- Google fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Work+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/choices.js/public/assets/styles/base.min.css" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/choices.js/public/assets/styles/choices.min.css" />

    <link href="https://fonts.googleapis.com/css2?family=Material+Icons+Outlined" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" integrity="sha512-1ycn6IcaQQ40/MKBW2W4Rhis/DbILU74C1vSrLJxCq57o941Ym01SwNsOMqvEBFlcgUa6xLiPY/NS5R+E6ztJQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A==" crossorigin="" />

    <!-- Stylesheets -->
    <link rel="stylesheet" href="{{ asset('css/vendors.css') }}">
    <link rel="stylesheet" href="{{ asset('css/main.css') }}">

    {{ $styles ?? '' }}
</head>

<body class="preloader-visible" data-barba="wrapper">
    <!-- preloader start -->
    <div class="preloader js-preloader">
        <div class="preloader__bg"></div>
    </div>
    <!-- preloader end -->

    <main class="main-content bg-beige-1">

        <header data-anim="fade" data-add-bg="" class="header -base js-header">
            <div class="header__container py-10">
                <div class="row justify-between items-center">
                    <div class="col-auto">
                        <div class="header-left">
                            <div class="header__logo">
                                <a data-barba href="{{ url('/') }}">
                                    <img src="{{ asset('img/general/logo.svg') }}" alt="logo">
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="col-auto">
                        <div class="header-right d-flex items-center">
                            <div class="d-none xl:d-flex items-center px-20 py-20">
                                @guest
                                    <a href="{{ route('login') }}" class="text-dark-1">{{ __('Log in') }}</a>
                                    @if (Route::has('register'))
                                        <a href="{{ route('register') }}" class="text-dark-1 ml-30">{{ __('Sign Up') }}</a>
                                    @endif
                                @else
                                    @php
                                        $user = Auth::user();
                                        $dashboardRoute = ''; // Initialize
                                        if ($user->isStudent()) {
                                            $dashboardRoute = 'student.overview';
                                        } elseif ($user->isParent()) {
                                            $dashboardRoute = 'parent.overview';
                                        } elseif ($user->isTeacher()) {
                                            $dashboardRoute = 'teacher.overview';
                                        } elseif ($user->isAdmin()) {
                                            $dashboardRoute = 'admin.overview';
                                        }
                                    @endphp
                                    <a href="{{ $dashboardRoute ? route($dashboardRoute) : '#' }}" class="text-dark-1">{{ __('Dashboard') }}</a>
                                    <a href="#" onclick="event.preventDefault(); document.getElementById('logout-form-header').submit();" class="text-dark-1 ml-30">{{ __('Log Out') }}</a>
                                    <form id="logout-form-header" action="{{ route('logout') }}" method="POST" style="display: none;">
                                        @csrf
                                    </form>
                                @endguest
                            </div>
                            <div class="header-right__buttons md:d-none">
                                @guest
                                    @if (Route::has('register'))
                                        <a href="{{ route('register') }}" class="button -sm -rounded -dark-1 text-white">{{ __('Sign Up') }}</a>
                                    @endif
                                @else
                                    @php
                                        $user = Auth::user();
                                        $dashboardRouteMd = ''; // Initialize
                                        if ($user->isStudent()) {
                                            $dashboardRouteMd = 'student.overview';
                                        } elseif ($user->isParent()) {
                                            $dashboardRouteMd = 'parent.overview';
                                        } elseif ($user->isTeacher()) {
                                            $dashboardRouteMd = 'teacher.overview';
                                        } elseif ($user->isAdmin()) {
                                            $dashboardRouteMd = 'admin.overview';
                                        }
                                    @endphp
                                    <a href="{{ $dashboardRouteMd ? route($dashboardRouteMd) : '#' }}" class="button -sm -rounded -dark-1 text-white">{{ __('Dashboard') }}</a>
                                @endguest
                            </div>
                             <div class="xl:d-none ml-20 header-menu-toggle js-mobile-menu-toggle">
                                <button class="text-dark-1 items-center">
                                    <i class="text-11 icon icon-mobile-menu"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <div class="content-wrapper js-content-wrapper">
            <section class="form-page">
                <div class="form-page__img bg-dark-1">
                    <div class="form-page-composition">
                                    <div class="-el-1"><img data-move="20" class="js-mouse-move" src="{{ asset('img/home-1/hero/bg.png') }}" alt="image"></div>
                        <div class="-el-2"><img data-move="40" class="js-mouse-move" src="{{ asset('img/home-1/hero/1.png') }}" alt="icon"></div>
                        <div class="-el-4"><img data-move="40" class="js-mouse-move" src="{{ asset('img/home-1/hero/3.png') }}" alt="icon"></div>   
                       
                    </div>
                </div>

                <div class="form-page__content lg:py-50">
                    <div class="container">
                        <div class="row justify-center items-center">
                            <div class="col-xl-12 col-lg-12">
                                <div class="px-50 py-50 md:px-25 md:py-25 bg-white shadow-1 rounded-16">
                                    {{ $slot }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </main>

    <!-- JavaScript -->
    <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js" integrity="sha512-XQoYMqMTK8LvdxXYG3nZ448hOEQiglfqkJs1NOQV44cWnUrBc8PkAOcXy20w0vlaXaVUearIOBhiXZ5V3ynxwA==" crossorigin=""></script>
    <script src="{{ asset('js/vendors.js') }}"></script>
    <script src="{{ asset('js/main.js') }}"></script>
    
    {{ $scripts ?? '' }}
</body>
</html> 