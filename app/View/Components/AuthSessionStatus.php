<?php

namespace App\View\Components;

use Illuminate\View\Component;

class AuthSessionStatus extends Component
{
    /**
     * The session status message.
     *
     * @var string|null
     */
    public $status;

    /**
     * Create a new component instance.
     *
     * @param string|null $status
     *
     * @return void
     */
    public function __construct($status = null)
    {
        $this->status = $status;
    }

    /**
     * Get the view / contents that represent the component.
     *
     * @return \Illuminate\Contracts\View\View|\Closure|string
     */
    public function render()
    {
        return view('components.auth-session-status');
    }
}
