      <header class="header -dashboard -dark-bg-dark-1 js-header">
        <div class="header__container py-20 px-30">
          <div class="row justify-between items-center">
            <div class="col-auto">
              <div class="d-flex items-center">
                <div class="header__explore text-dark-1">
                  <button class="d-flex items-center js-dashboard-home-9-sidebar-toggle">
                    <i class="icon -dark-text-white icon-explore"></i>
                  </button>
                </div>

                <div class="header__logo ml-30 md:ml-20">
                  <a data-barba href="{{ url('/') }}">
                    <img class="-light-d-none" src="{{ asset('img/general/logo.svg') }}" alt="logo">
                    <img class="-dark-d-none" src="{{ asset('img/general/logo-dark.svg') }}" alt="logo">
                  </a>
                </div>
              </div>
            </div>

            <div class="col-auto">
              <div class="d-flex items-center">
                <div class="text-white d-flex items-center lg:d-none mr-15">
                  <div class="dropdown bg-transparent px-0 py-0">
                    <div class="d-flex items-center text-14 text-dark-1">
                      All Pages <i class="text-9 icon-chevron-down ml-10"></i>
                    </div>
                    <div class="dropdown__item -dark-bg-dark-2 -dark-border-white-10">
                      <div class="text-14 y-gap-15">
                        @auth
                            <div><a href="{{ route('home') }}" class="d-block text-dark-1">Home</a></div>
                            @php
                                $user = Auth::user();
                                $headerDashboardRoute = '';
                                if ($user->isTeacher()) {
                                    $headerDashboardRoute = 'teacher.overview';
                                } elseif ($user->isAdmin()) {
                                    $headerDashboardRoute = 'admin.overview';
                                } elseif ($user->isStudent()) {
                                    $headerDashboardRoute = 'student.overview';
                                } elseif ($user->isParent()) {
                                    $headerDashboardRoute = 'parent.overview';
                                }
                            @endphp
                            <div><a href="{{ $headerDashboardRoute ? route($headerDashboardRoute) : '#' }}" class="d-block text-dark-1">Dashboard</a></div>

                            {{-- My Courses Link --}}
                            @if ($user->isStudent())
                                <div><a href="{{ route('student.my-learning') }}" class="d-block text-dark-1">My Learning</a></div>
                            @elseif ($user->isTeacher())
                                <div><a href="{{ route('teacher.courses.index') }}" class="d-block text-dark-1">My @lmsterm('Study Materials')</a></div>
                            @elseif ($user->isAdmin())
                                <div><a href="{{ route('admin.courses.index') }}" class="d-block text-dark-1">@lmsterm('Study Material') Management</a></div>
                            @endif {{-- No "My Courses" for Parent for now --}}

                            {{-- Bookmarks Link (Student Only) --}}
                            @if ($user->isStudent())
                                <div><a href="{{ route('student.bookmarked-courses') }}" class="d-block text-dark-1">Bookmarks</a></div>
                            @endif

                            {{-- Add Listing/Create Course Link (Teacher Only) --}}
                            @if ($user->isTeacher())
                                <div><a href="{{ route('teacher.courses.create') }}" class="d-block text-dark-1">Create @lmsterm('Study Material')</a></div>
                            @endif

                            {{-- Reviews Link (Teacher Only) --}}
                            @if ($user->isTeacher())
                                <div><a href="{{ route('teacher.reviews.index') }}" class="d-block text-dark-1">Reviews</a></div>
                            @endif

                            {{-- Settings Link --}}
                            @php $settingsRoute = ''; @endphp
                            @if ($user->isStudent())
                                @php $settingsRoute = 'student.settings'; @endphp
                            @elseif ($user->isTeacher())
                                @php $settingsRoute = 'teacher.settings.profile'; @endphp
                            @elseif ($user->isAdmin())
                                @php $settingsRoute = 'admin.settings.index'; @endphp
                            @elseif ($user->isParent())
                                @php $settingsRoute = 'parent.settings'; @endphp
                            @endif
                            @if ($settingsRoute)
                                <div><a href="{{ route($settingsRoute) }}" class="d-block text-dark-1">Settings</a></div>
                            @endif
                        @else
                            {{-- Link for guests if needed, or remove --}}
                            <div><a href="{{ url('/') }}" class="d-block text-dark-1">Home</a></div>
                        @endauth
                        {{-- Removed old static links --}}
                      </div>
                    </div>
                  </div>

                  <div class="relative">
                    <a href="#" class="d-flex items-center text-dark-1 ml-20" data-el-toggle=".js-courses-toggle">
                      My @lmsterm('Study Materials') <i class="text-9 icon-chevron-down ml-10"></i>
                    </a>

                    <div class="toggle-element js-courses-toggle">
                      <div class="toggle-bottom -courses bg-white -dark-bg-dark-1 shadow-4 border-light rounded-8 mt-20">
                        <div class="px-30 py-30">

                          {{-- This section with static course examples is likely decorative or needs dynamic content --}}
                          <div class="d-flex mb-20">
                            <img class="size-80 fit-cover" src="{{ asset('img/menus/cart/1.png') }}" alt="image">
                            <div class="ml-15">
                              <div class="text-dark-1 lh-15 fw-500">Complete Python Bootcamp From Zero to Hero in Python</div>
                              <div class="progress-bar mt-20">
                                <div class="progress-bar__bg bg-light-3"></div>
                                <div class="progress-bar__bar bg-purple-1 w-1/3"></div>
                              </div>
                            </div>
                          </div>
                          <div class="d-flex mb-20">
                            <img class="size-80 fit-cover" src="{{ asset('img/menus/cart/2.png') }}" alt="image">
                            <div class="ml-15">
                              <div class="text-dark-1 lh-15 fw-500">The Ultimate Drawing Course Beginner to Advanced</div>
                              <div class="progress-bar mt-20">
                                <div class="progress-bar__bg bg-light-3"></div>
                                <div class="progress-bar__bar bg-purple-1 w-1/3"></div>
                              </div>
                            </div>
                          </div>

                          <div class="mt-20">
                            @auth
                                @php
                                    $user = Auth::user();
                                    $myLearningRoute = '';
                                    if ($user->isStudent()) {
                                        $myLearningRoute = 'student.my-learning';
                                    } elseif ($user->isTeacher()) {
                                        $myLearningRoute = 'teacher.courses.index';
                                    } elseif ($user->isAdmin()) {
                                        $myLearningRoute = 'admin.courses.index';
                                    }
                                    // Parent: No direct "Go to My Learning" equivalent from this flyout for now
                                @endphp
                                @if ($myLearningRoute)
                                    <a href="{{ route($myLearningRoute) }}" class="button py-20 -dark-1 text-white -dark-bg-purple-1 -dark-border-dark-2 col-12">
                                        @if ($user->isStudent()) My Learning @else My @lmsterm('Study Materials') @endif
                                    </a>
                                @endif
                            @endauth
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="d-flex items-center sm:d-none">
                  <div class="relative">
                    <button class="js-darkmode-toggle text-light-1 d-flex items-center justify-center size-50 rounded-16 -hover-dshb-header-light">
                      <i class="text-24 icon icon-night"></i>
                    </button>
                  </div>

                  <div class="relative">
                    <button data-maximize class="d-flex text-light-1 items-center justify-center size-50 rounded-16 -hover-dshb-header-light">
                      <i class="text-24 icon icon-maximize"></i>
                    </button>
                  </div>

                  <div class="relative ">
                    <button class="d-flex items-center text-light-1 d-flex items-center justify-center size-50 rounded-16 -hover-dshb-header-light" data-el-toggle=".js-cart-toggle">
                      <i class="text-20 icon icon-basket"></i>
                    </button>

                    <div class="toggle-element js-cart-toggle">
                      <div class="header-cart bg-white -dark-bg-dark-1 rounded-8">
                        <div class="px-30 pt-30 pb-10">
                          <div class="row justify-between x-gap-40 pb-20">
                            <div class="col">
                              <div class="row x-gap-10 y-gap-10">
                                <div class="col-auto">
                                  <img src="{{ asset('img/menus/cart/1.png') }}" alt="image">
                                </div>
                                <div class="col">
                                  <div class="text-dark-1 lh-15">The Ultimate Drawing Course Beginner to Advanced...</div>
                                  <div class="d-flex items-center mt-10">
                                    <div class="lh-12 fw-500 line-through text-light-1 mr-10">$179</div>
                                    <div class="text-18 lh-12 fw-500 text-dark-1">$79</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div class="col-auto">
                              <button><img src="{{ asset('img/menus/close.svg') }}" alt="icon"></button>
                            </div>
                          </div>
                          <div class="row justify-between x-gap-40 pb-20">
                            <div class="col">
                              <div class="row x-gap-10 y-gap-10">
                                <div class="col-auto">
                                  <img src="{{ asset('img/menus/cart/2.png') }}" alt="image">
                                </div>
                                <div class="col">
                                  <div class="text-dark-1 lh-15">User Experience Design Essentials - Adobe XD UI UX...</div>
                                  <div class="d-flex items-center mt-10">
                                    <div class="lh-12 fw-500 line-through text-light-1 mr-10">$179</div>
                                    <div class="text-18 lh-12 fw-500 text-dark-1">$79</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div class="col-auto">
                              <button><img src="{{ asset('img/menus/close.svg') }}" alt="icon"></button>
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
                              <button class="button py-20 -dark-1 text-white -dark-button-white col-12">View Cart</button>
                            </div>
                            <div class="col-sm-6">
                              <button class="button py-20 -purple-1 text-white col-12">Checkout</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="relative">
                    <a href="#" class="d-flex items-center text-light-1 justify-center size-50 rounded-16 -hover-dshb-header-light" data-el-toggle=".js-msg-toggle">
                      <i class="text-24 icon icon-email"></i>
                    </a>
                  </div>

                  <div class="relative">
                    <a href="#" class="d-flex items-center text-light-1 justify-center size-50 rounded-16 -hover-dshb-header-light" data-el-toggle=".js-notif-toggle">
                      <i class="text-24 icon icon-notification"></i>
                    </a>
                    <div class="toggle-element js-notif-toggle">
                      <div class="toggle-bottom -notifications bg-white -dark-bg-dark-1 shadow-4 border-light rounded-8 mt-10">
                        <div class="py-30 px-30">
                          <div class="y-gap-40">
                            <div class="d-flex items-center ">
                              <div class="shrink-0">
                                <img src="{{ asset('img/dashboard/actions/1.png') }}" alt="image">
                              </div>
                              <div class="ml-12">
                                <h4 class="text-15 lh-1 fw-500">Your resume updated!</h4>
                                <div class="text-13 lh-1 mt-10">1 Hours Ago</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="relative d-flex items-center ml-10">
                  <a href="#" data-el-toggle=".js-profile-toggle">
                    <img class="size-50" src="{{ asset('img/misc/user-profile.png') }}" alt="image">
                  </a>
                  <div class="toggle-element js-profile-toggle">
                    <div class="toggle-bottom -profile bg-white -dark-bg-dark-1 shadow-4 border-light rounded-8 mt-10">
                      <div class="px-30 py-30">
                        <div class="sidebar -dashboard">
                          <div class="sidebar__item -is-active -dark-bg-dark-2">
                            @auth
                                @php
                                    // Re-using the same logic, ensure variable names don't clash if this partial is complex
                                    // Or ideally, this logic would be in a View Composer or a Blade component attribute
                                    $userProfileDashboardRoute = '';
                                    if (Auth::user()->isTeacher()) {
                                        $userProfileDashboardRoute = 'teacher.overview';
                                    } elseif (Auth::user()->isAdmin()) {
                                        $userProfileDashboardRoute = 'admin.overview';
                                    } elseif (Auth::user()->isStudent()) {
                                        $userProfileDashboardRoute = 'student.overview';
                                    } elseif (Auth::user()->isParent()) {
                                        $userProfileDashboardRoute = 'parent.overview';
                                    }
                                @endphp
                                <a href="{{ $userProfileDashboardRoute ? route($userProfileDashboardRoute) : '#' }}" class="d-flex items-center text-17 lh-1 fw-500 -dark-text-white">
                              <i class="text-20 icon-discovery mr-15"></i>Dashboard
                            </a>
                            @endauth
                          </div>
                          <div class="sidebar__item ">
                            @auth
                                @php $user = Auth::user(); $myCoursesRoute = ''; $myCoursesLabel = 'My Courses'; @endphp
                                @if ($user->isStudent())
                                    @php $myCoursesRoute = 'student.my-learning'; $myCoursesLabel = 'My Learning'; @endphp
                                @elseif ($user->isTeacher())
                                    @php $myCoursesRoute = 'teacher.courses.index'; @endphp
                                @elseif ($user->isAdmin())
                                    @php $myCoursesRoute = 'admin.courses.index'; $myCoursesLabel = 'Course Management'; @endphp
                                @endif
                                @if ($myCoursesRoute)
                                    <a href="{{ route($myCoursesRoute) }}" class="d-flex items-center text-17 lh-1 fw-500 ">
                                      <i class="text-20 icon-play-button mr-15"></i>{{ $myCoursesLabel }}
                                    </a>
                                @endif
                            @endauth
                          </div>
                          <div class="sidebar__item ">
                            @auth
                                @if (Auth::user()->isStudent())
                                    <a href="{{ route('student.bookmarked-courses') }}" class="d-flex items-center text-17 lh-1 fw-500 ">
                              <i class="text-20 icon-bookmark mr-15"></i>Bookmarks
                            </a>
                                @endif
                            @endauth
                          </div>
                          <div class="sidebar__item ">
                            @auth
                                @php $user = Auth::user(); $messagesRoute = ''; @endphp
                                @if ($user->isStudent())
                                    @php $messagesRoute = 'student.messages'; @endphp
                                @elseif ($user->isTeacher())
                                    @php $messagesRoute = 'teacher.messages.index'; @endphp
                                @elseif ($user->isParent())
                                    @php $messagesRoute = 'parent.messages'; @endphp
                                @elseif ($user->isAdmin())
                                    @php $messagesRoute = 'admin.messages.index'; @endphp
                                @endif
                                @if ($messagesRoute)
                                    <a href="{{ route($messagesRoute) }}" class="d-flex items-center text-17 lh-1 fw-500 ">
                              <i class="text-20 icon-message mr-15"></i>Messages
                            </a>
                                @endif
                            @endauth
                          </div>
                          <div class="sidebar__item ">
                            @auth
                                @if (Auth::user()->isTeacher()) {{-- Assuming Create Course is teacher-specific for this link --}}
                                    <a href="{{ route('teacher.courses.create') }}" class="d-flex items-center text-17 lh-1 fw-500 ">
                              <i class="text-20 icon-list mr-15"></i>Create Course
                            </a>
                                @endif
                            @endauth
                          </div>
                          <div class="sidebar__item ">
                            @auth
                                @if (Auth::user()->isTeacher()) {{-- Assuming Reviews is teacher-specific for this link --}}
                                    <a href="{{ route('teacher.reviews.index') }}" class="d-flex items-center text-17 lh-1 fw-500 ">
                              <i class="text-20 icon-comment mr-15"></i>Reviews
                            </a>
                                @endif
                            @endauth
                          </div>
                          <div class="sidebar__item ">
                            @auth
                                @php $user = Auth::user(); $settingsRoute = ''; @endphp
                                @if ($user->isStudent())
                                    @php $settingsRoute = 'student.settings'; @endphp
                                @elseif ($user->isTeacher())
                                    @php $settingsRoute = 'teacher.settings.profile'; @endphp
                                @elseif ($user->isAdmin())
                                    @php $settingsRoute = 'admin.settings.index'; @endphp
                                @elseif ($user->isParent())
                                    @php $settingsRoute = 'parent.settings'; @endphp
                                @endif
                                @if ($settingsRoute)
                                    <a href="{{ route($settingsRoute) }}" class="d-flex items-center text-17 lh-1 fw-500 ">
                              <i class="text-20 icon-setting mr-15"></i>Settings
                            </a>
                                @endif
                            @endauth
                          </div>
                          <div class="sidebar__item ">
                            <a href="{{ route('logout') }}" class="d-flex items-center text-17 lh-1 fw-500 " 
                               onclick="event.preventDefault(); document.getElementById('logout-form').submit();">
                              <i class="text-20 icon-power mr-15"></i>Logout
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      <form id="logout-form" action="{{ route('logout') }}" method="POST" style="display: none;">
        @csrf
      </form> 