            <footer class="footer -dashboard py-30">
              <div class="row items-center justify-between">
                <div class="col-auto">
                  <div class="text-13 lh-1">
                    &copy; {{ date('Y') }} {{ config('app.name') }}. All Rights Reserved. {{-- Dynamic year and corrected copyright symbol --}}
                  </div>
                </div>

                <div class="col-auto">
                  <div class="d-flex items-center">
                    <div class="d-flex items-center flex-wrap x-gap-20">
                      <div>
                        <a href="{{ url('/') }}" class="text-13 lh-1">Help</a> {{-- Placeholder: Link to a generic help page or a specific route --}}
                      </div>
                      <div>
                        <a href="{{ url('/') }}" class="text-13 lh-1">Privacy Policy</a> {{-- Placeholder: Link to privacy policy page --}}
                      </div>
                      <div>
                        <a href="{{ url('/') }}" class="text-13 lh-1">Cookie Notice</a> {{-- Placeholder: Link to cookie notice page --}}
                      </div>
                      <div>
                        <a href="{{ url('/') }}" class="text-13 lh-1">Security</a> {{-- Placeholder: Link to security page --}}
                      </div>
                      <div>
                        <a href="{{ url('/') }}" class="text-13 lh-1">Terms of Use</a> {{-- Placeholder: Link to terms page --}}
                      </div>
                    </div>

                    <button class="button -md -rounded bg-light-4 text-light-1 ml-30">English</button> {{-- Language switcher, may need dynamic behavior --}}
                  </div>
                </div>
              </div>
            </footer> 