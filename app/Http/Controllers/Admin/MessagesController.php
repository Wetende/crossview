<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;

final class MessagesController extends Controller
{
    /**
     * Display a listing of messages for the admin.
     */
    public function index(Request $request): View
    {

        $conversations = collect([
            (object)[
                'id' => 1,
                'participant_name' => 'Teacher Sarah / Student John',
                'participant_avatar' => asset('img/avatars/small/1.png'),
                'latest_message_snippet' => 'Regarding Project Alpha submission...',
                'timestamp_human' => '10 mins ago',
                'unread_count' => 2,
                'is_active' => true,
            ],
            (object)[
                'id' => 2,
                'participant_name' => 'Support Inquiry #12345',
                'participant_avatar' => asset('img/avatars/small/3.png'),
                'latest_message_snippet' => 'System Update Notification',
                'timestamp_human' => '2 days ago',
                'unread_count' => 0,
                'is_active' => false,
            ],

        ]);


        if ($request->has('search_query') && $request->filled('search_query')) {
            $searchTerm = $request->input('search_query');


        }

        return view('admin.messages.index', compact('conversations'));
    }

    /**
     * Display the specified message.
     */









    /**
     * Store a newly created message in storage.
     */
    public function store(Request $request): RedirectResponse
    {











        return back()->with('info', 'Admin message store action hit - Not Implemented Yet (Conversation ID: ' . $request->input('conversation_id', 'N/A') . ')');
    }
}
