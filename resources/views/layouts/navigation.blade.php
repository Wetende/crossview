<header data-anim="fade" data-add-bg="bg-dark-1" class="header -type-1 js-header">


    <div class="header__container">
        <div class="row justify-between items-center">

            <div class="col-auto">
                <div class="header-left">

                    <div class="header__logo ">
                        <a data-barba href="/">
                            <h2 class="text-white font-bold text-4xl">{{ config('app.short_name', 'Crossview College') }}</h2>
                        </a>
                    </div>


                    <div class="header__explore text-green-1 ml-60 xl:ml-30 xl:d-none">
                        <a href="#" class="d-flex items-center" data-el-toggle=".js-explore-toggle">
                            <i class="icon icon-explore mr-15"></i>
                            Explore
                        </a>
                    
                        <div class="explore-content py-25 rounded-8 bg-white toggle-element js-explore-toggle">
                            <!-- Core Subjects -->
                            <div class="explore__item">
                                <a href="#" class="d-flex items-center justify-between text-dark-1">
                                    Core Subjects<div class="icon-chevron-right text-11"></div>
                                </a>
                                <div class="explore__subnav rounded-8">
                                    <a class="text-dark-1" href="#">English</a>
                                    <a class="text-dark-1" href="#">Mathematics</a>
                                    <a class="text-dark-1" href="#">Kiswahili</a>
                                </div>
                            </div>
                    
                            <!-- Sciences -->
                            <div class="explore__item">
                                <a href="#" class="d-flex items-center justify-between text-dark-1">
                                    Sciences<div class="icon-chevron-right text-11"></div>
                                </a>
                                <div class="explore__subnav rounded-8">
                                    <a class="text-dark-1" href="#">Physics</a>
                                    <a class="text-dark-1" href="#">Chemistry</a>
                                    <a class="text-dark-1" href="#">Biology</a>
                                </div>
                            </div>
                    
                            <!-- Humanities -->
                            <div class="explore__item">
                                <a href="#" class="d-flex items-center justify-between text-dark-1">
                                    Humanities<div class="icon-chevron-right text-11"></div>
                                </a>
                                <div class="explore__subnav rounded-8">
                                    <a class="text-dark-1" href="#">History</a>
                                    <a class="text-dark-1" href="#">Geography</a>
                                    <a class="text-dark-1" href="#">Literature</a>
                                </div>
                            </div>
                    
                            <!-- Languages -->
                            <div class="explore__item">
                                <a href="#" class="d-flex items-center justify-between text-dark-1">
                                    Languages<div class="icon-chevron-right text-11"></div>
                                </a>
                                <div class="explore__subnav rounded-8">
                                    <a class="text-dark-1" href="#">French</a>
                                    <a class="text-dark-1" href="#">English</a>
                                    <a class="text-dark-1" href="#">Kiswahili</a>
                                </div>
                            </div>
                    
                            <!-- Business & Technology -->
                            <div class="explore__item">
                                <a href="#" class="d-flex items-center justify-between text-dark-1">
                                    Business & Technology<div class="icon-chevron-right text-11"></div>
                                </a>
                                <div class="explore__subnav rounded-8">
                                    <a class="text-dark-1" href="#">Commerce</a>
                                    <a class="text-dark-1" href="#">Entrepreneurship</a>
                                    <a class="text-dark-1" href="#">Computer Studies</a>
                                </div>
                            </div>
                    
                            <!-- Applied Sciences -->
                            <div class="explore__item">
                                <a href="#" class="d-flex items-center justify-between text-dark-1">
                                    Applied Sciences<div class="icon-chevron-right text-11"></div>
                                </a>
                                <div class="explore__subnav rounded-8">
                                    <a class="text-dark-1" href="#">Agriculture</a>
                                    <a class="text-dark-1" href="#">Home Economics</a>
                                </div>
                            </div>
                    
                            <!-- Technical Subjects -->
                            <div class="explore__item">
                                <a href="#" class="d-flex items-center justify-between text-dark-1">
                                    Technical Subjects<div class="icon-chevron-right text-11"></div>
                                </a>
                                <div class="explore__subnav rounded-8">
                                    <a class="text-dark-1" href="#">Woodwork</a>
                                    <a class="text-dark-1" href="#">Metalwork</a>
                                </div>
                            </div>
                    
                            <!-- Creative Arts -->
                            <div class="explore__item">
                                <a href="#" class="d-flex items-center justify-between text-dark-1">
                                    Creative Arts<div class="icon-chevron-right text-11"></div>
                                </a>
                                <div class="explore__subnav rounded-8">
                                    <a class="text-dark-1" href="#">Art</a>
                                    <a class="text-dark-1" href="#">Music</a>
                                </div>
                            </div>
                    
                            <!-- Physical Education -->
                            <div class="explore__item">
                                <a href="#" class="text-dark-1">Physical Education</a>
                            </div>
                    
                            <!-- View All Link -->
                            <div class="explore__item">
                                <a href="#" class="text-purple-1 underline">View All Subjects</a>
                            </div>
                        </div>
                    </div>

                </div>
            </div>


            <div class="header-menu js-mobile-menu-toggle ">
                <div class="header-menu__content">
                    <div class="mobile-bg js-mobile-bg"></div>

                    <div class="d-none xl:d-flex items-center px-20 py-20 border-bottom-light">
                        @guest
                        <a href="{{ route('login') }}" class="text-dark-1">Log in</a>
                        <a href="{{ route('register') }}" class="text-dark-1 ml-30">Sign Up</a>
                        @endguest
                        @auth
                            @if (Auth::user()->isStudent())
                                <a href="{{ route('student.overview') }}" class="text-dark-1">Dashboard</a>
                            @elseif (Auth::user()->isTeacher())
                                <a href="{{ route('teacher.overview') }}" class="text-dark-1">Dashboard</a>
                            @elseif (Auth::user()->isParent())
                                <a href="{{ route('parent.overview') }}" class="text-dark-1">Dashboard</a>
                            @elseif (Auth::user()->isAdmin())
                                <a href="{{ route('admin.overview') }}" class="text-dark-1">Dashboard</a>
                            @else
                                <a href="{{ route('dashboard') }}" class="text-dark-1">Dashboard</a> {{-- Default fallback --}}
                            @endif
                            <a href="{{ route('profile.edit') }}" class="text-dark-1 ml-30">Settings</a>
                            <form method="POST" action="{{ route('logout') }}" class="ml-30" style="display: inline;">
                                @csrf
                                <a href="{{ route('logout') }}"
                                   onclick="event.preventDefault(); this.closest('form').submit();"
                                   class="text-dark-1">
                                    Logout
                                </a>
                            </form>
                        @endauth
                    </div>

                    <div class="menu js-navList">
                        <ul class="menu__nav text-white -is-active">
                            <li class="menu-item-has-children">
                                <a  href="{{ route('home') }}" style="cursor: pointer">Home</a>
                            </li>
                            @auth
                                @if (Auth::user()->isStudent())
                                    <li><a data-barba href="{{ route('student.overview') }}">Dashboard</a></li>
                                @elseif (Auth::user()->isTeacher())
                                    <li><a data-barba href="{{ route('teacher.overview') }}">Dashboard</a></li>
                                @elseif (Auth::user()->isParent())
                                    <li><a data-barba href="{{ route('parent.overview') }}">Dashboard</a></li>
                                @elseif (Auth::user()->isAdmin())
                                    <li><a data-barba href="{{ route('admin.overview') }}">Dashboard</a></li>
                                @else
                                    {{-- Fallback or no dashboard link if role is not matched --}}
                                    <li><a data-barba href="{{ route('dashboard') }}">Dashboard</a></li> {{-- Default fallback --}}
                                @endif
                            @endauth
                            <li>
                                <a data-barba href="/about">About Us</a>
                            </li>

                            <li>
                                <a data-barba href="{{ route('courses.list') }}">@lmsterm('Study Materials')</a>
                            </li>

                            <li>
                                <a data-barba href="{{ route('shop.index') }}">Shop</a>
                            </li>

                            <li class="menu-item-has-children">
                                <a data-barba href="#" style="cursor: pointer" onclick="window.location.href='/events'">Events</a>
                            </li>

                           

                            <li>
                                <a data-barba href="/pricing">Pricing</a>
                            </li>

                                                    
                            <li>
                                <a data-barba href="/contact">Contact</a>
                            </li>
                        </ul>
                    </div>

                    <div class="mobile-footer px-20 py-20 border-top-light js-mobile-footer">
                        <div class="mobile-footer__number">
                            <div class="text-17 fw-500 text-dark-1">Call us</div>
                            <div class="text-17 fw-500 text-purple-1">800 388 80 90</div>
                        </div>

                        <div class="lh-2 mt-10">
                            <div>329 Queensberry Street,<br> North Melbourne VIC 3051, Australia.</div>
                            <div>info@crossviewcollege.edu</div>
                        </div>

                        <div class="mobile-socials mt-10">

                            <a href="#" class="d-flex items-center justify-center rounded-full size-40">
                                <i class="fa fa-facebook"></i>
                            </a>

                            <a href="#" class="d-flex items-center justify-center rounded-full size-40">
                                <i class="fa fa-twitter"></i>
                            </a>

                            <a href="#" class="d-flex items-center justify-center rounded-full size-40">
                                <i class="fa fa-instagram"></i>
                            </a>

                            <a href="#" class="d-flex items-center justify-center rounded-full size-40">
                                <i class="fa fa-linkedin"></i>
                            </a>

                        </div>
                    </div>
                </div>

                <div class="header-menu-close" data-el-toggle=".js-mobile-menu-toggle">
                    <div class="size-40 d-flex items-center justify-center rounded-full bg-white">
                        <div class="icon-close text-dark-1 text-16"></div>
                    </div>
                </div>

                <div class="header-menu-bg"></div>
            </div>


            <div class="col-auto">
                <div class="header-right d-flex items-center">
                    <div class="header-right__icons text-white d-flex items-center">

                        <div class="">
                            <a href="{{ route('shop.index') }}" class="d-flex items-center text-white">
                                <i class="text-20 icon icon-store"></i>
                            </a>
                        </div>

                        <div class="ml-30 xl:ml-20">
                            <button class="d-flex items-center text-white" data-el-toggle=".js-search-toggle">
                                <i class="text-20 icon icon-search"></i>
                            </button>

                            <div class="toggle-element js-search-toggle">
                                <div class="header-search pt-90 bg-white shadow-4">
                                    <div class="container">
                                        <div class="header-search__field">
                                            <div class="icon icon-search text-dark-1"></div>
                                            <input type="text" class="col-12 text-18 lh-12 text-dark-1 fw-500"
                                                placeholder="What @lmsterm('Study Material') do you want to learn?">

                                            <button
                                                class="d-flex items-center justify-center size-40 rounded-full bg-purple-3"
                                                data-el-toggle=".js-search-toggle">
                                                <img src="img/menus/close.svg" alt="icon">
                                            </button>
                                        </div>

                                        <div class="header-search__content mt-30">
                                            <div class="text-17 text-dark-1 fw-500">Quick Links</div>

                                            <div class="d-flex y-gap-5 flex-column mt-20">
                                                <a href="{{ route('courses.list') }}" class="text-dark-1">Browse All @lmsterm('Study Materials')</a>
                                                <a href="{{ route('courses.list') }}" class="text-dark-1">Featured @lmsterm('Study Materials')</a>
                                                <a href="{{ route('courses.list') }}" class="text-dark-1">Free @lmsterm('Study Materials')</a>
                                                <a href="/instructors" class="text-dark-1">Find Instructors</a>
                                                <a href="/instructors/become" class="text-dark-1">Become an Instructor</a>
                                            </div>

                                            <div class="mt-30">
                                                <a href="{{ route('courses.list') }}" class="uppercase underline">VIEW ALL @lmsterm('STUDY MATERIALS')</a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="header-search__bg" data-el-toggle=".js-search-toggle"></div>
                            </div>
                        </div>


                        <div class="relative ml-30 xl:ml-20">
                            <button class="d-flex items-center text-white" data-el-toggle=".js-cart-toggle">
                                <i class="text-20 icon icon-basket"></i>
                            </button>

                            <div class="toggle-element js-cart-toggle">
                                <div class="header-cart bg-white -dark-bg-dark-1 rounded-8">
                                    <div class="px-30 pt-30 pb-10">

                                        <div class="row justify-between x-gap-40 pb-20">
                                            <div class="col">
                                                <div class="row x-gap-10 y-gap-10">
                                                    <div class="col-auto">
                                                        <img src="img/menus/cart/1.png" alt="image">
                                                    </div>

                                                    <div class="col">
                                                        <div class="text-dark-1 lh-15">The Ultimate Drawing Course S1 to S6...</div>

                                                        <div class="d-flex items-center mt-10">
                                                            <div class="lh-12 fw-500 line-through text-light-1 mr-10">
                                                                $179</div>
                                                            <div class="text-18 lh-12 fw-500 text-dark-1">$79</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="col-auto">
                                                <button><img src="img/menus/close.svg" alt="icon"></button>
                                            </div>
                                        </div>

                                        <div class="row justify-between x-gap-40 pb-20">
                                            <div class="col">
                                                <div class="row x-gap-10 y-gap-10">
                                                    <div class="col-auto">
                                                        <img src="img/menus/cart/2.png" alt="image">
                                                    </div>

                                                    <div class="col">
                                                        <div class="text-dark-1 lh-15">User Experience Design
                                                            Essentials - Adobe XD UI UX...</div>

                                                        <div class="d-flex items-center mt-10">
                                                            <div class="lh-12 fw-500 line-through text-light-1 mr-10">
                                                                $179</div>
                                                            <div class="text-18 lh-12 fw-500 text-dark-1">$79</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="col-auto">
                                                <button><img src="img/menus/close.svg" alt="icon"></button>
                                            </div>
                                        </div>

                                    </div>

                                    <div class="px-30 pt-20 pb-30 border-top-light">
                                        <div class="d-flex justify-between">
                                            <div class="text-18 lh-12 text-dark-1 fw-500">Total:</div>
                                            <div class="text-18 lh-12 text-dark-1 fw-500">$659</div>
                                        </div>

                                        <div class="row x-gap-20 y-gap-10 pt-30">
                                            <div class="col-sm-6">
                                                <a href="{{ route('shop.cart') }}" class="button py-20 -dark-1 text-white -dark-button-white col-12">View Cart</a>
                                            </div>
                                            <div class="col-sm-6">
                                                <a href="{{ route('shop.checkout') }}" class="button py-20 -purple-1 text-white col-12">Checkout</a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                        <div class="d-none xl:d-block ml-20">
                            <button class="text-white items-center" data-el-toggle=".js-mobile-menu-toggle">
                                <i class="text-11 icon icon-mobile-menu"></i>
                            </button>
                        </div>

                    </div>

                    <div class="header-right__buttons d-flex items-center ml-30 md:d-none">
                        @guest
                        <a href="{{ route('login') }}" class="button -underline text-white">Log in</a>
                        <a href="{{ route('register') }}" class="button -sm -white text-dark-1 ml-30">Sign up</a>
                        @endguest
                        @auth
                        <div class="relative ml-15">
                            <a href="#" class="button -underline text-white d-flex items-center" data-el-toggle=".js-user-dropdown-toggle" onclick="event.preventDefault();">
                                {{ Auth::user()->name ?? 'User' }}
                                <i class="icon-chevron-down text-11 ml-10"></i>
                            </a>

                            <div class="toggle-element js-user-dropdown-toggle" style="position: absolute; right: 0; top: 100%; z-index: 99; min-width: 100px; margin-top: 10px;">
                                <div class="header-cart bg-white -dark-bg-dark-1 rounded-8 shadow-4 border-light">
                                    <div class="px-20 py-15">
                                        @if (Auth::user()->isStudent())
                                            <a href="{{ route('student.overview') }}" class="d-block text-dark-1 -dark-text-white py-10">My Dashboard</a>
                                        @elseif (Auth::user()->isTeacher())
                                            <a href="{{ route('teacher.overview') }}" class="d-block text-dark-1 -dark-text-white py-10">My Dashboard</a>
                                        @elseif (Auth::user()->isParent())
                                            <a href="{{ route('parent.overview') }}" class="d-block text-dark-1 -dark-text-white py-10">My Dashboard</a>
                                        @elseif (Auth::user()->isAdmin())
                                            <a href="{{ route('admin.overview') }}" class="d-block text-dark-1 -dark-text-white py-10">My Dashboard</a>
                                        @else
                                            {{-- Fallback if no specific role dashboard --}}
                                            <a href="{{ route('dashboard') }}" class="d-block text-dark-1 -dark-text-white py-10">My Dashboard</a> 
                                        @endif
                                        
                                        <a href="{{ route('profile.edit') }}" class="d-block text-dark-1 -dark-text-white py-10">Profile Settings</a>

                                        <div class="border-top-light -dark-border-top-dark-3 mt-10 mb-10"></div>

                                        <form method="POST" action="{{ route('logout') }}" style="margin:0;">
                                            @csrf
                                            <button type="submit" class="d-block text-dark-1 -dark-text-white py-10 w-1/1 text-left" style="background: none; border: none; padding: 0; cursor: pointer;">Logout</button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                        @endauth
                    </div>
                </div>
            </div>

        </div>
    </div>
</header>
