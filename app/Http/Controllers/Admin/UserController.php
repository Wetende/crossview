<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

final class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query()->with('roles');


        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }


        if ($request->filled('role')) {
            $role = $request->input('role');
            $query->whereHas('roles', function ($q) use ($role) {
                $q->where('name', $role);
            });
        }

        $users = $query->latest()->paginate(10);

        return view('admin.users.index', compact('users'));
    }

    public function create()
    {
        $roles = Role::all();
        return view('admin.users.create', compact('roles'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', Password::defaults()],
            'roles' => ['required', 'array'],
            'roles.*' => [Rule::exists('roles', 'id')],
            'profile_picture' => ['nullable', 'image', 'max:1024'],
            'is_active' => ['boolean'],
        ]);

        $user = new User();
        $user->name = $request->input('name');
        $user->email = $request->input('email');
        $user->password = Hash::make($request->input('password'));
        $user->is_active = $request->boolean('is_active', true);

        if ($request->hasFile('profile_picture')) {
            $path = $request->file('profile_picture')->store('profile_pictures', 'public');
            $user->profile_picture_path = $path;
        }

        $user->save();


        $user->roles()->attach($request->input('roles'));

        return redirect()->route('admin.users.index')
            ->with('success', 'User created successfully.');
    }

    public function show(User $user)
    {
        $user->load('roles');
        return view('admin.users.show', compact('user'));
    }

    public function edit(User $user)
    {
        $roles = Role::all();
        $user->load('roles');
        return view('admin.users.edit', compact('user', 'roles'));
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => ['nullable', Password::defaults()],
            'roles' => ['required', 'array'],
            'roles.*' => [Rule::exists('roles', 'id')],
            'profile_picture' => ['nullable', 'image', 'max:1024'],
            'is_active' => ['boolean'],
        ]);

        $user->name = $request->input('name');
        $user->email = $request->input('email');

        if ($request->filled('password')) {
            $user->password = Hash::make($request->input('password'));
        }

        $user->is_active = $request->boolean('is_active', true);

        if ($request->hasFile('profile_picture')) {

            if ($user->profile_picture_path) {
                Storage::disk('public')->delete($user->profile_picture_path);
            }

            $path = $request->file('profile_picture')->store('profile_pictures', 'public');
            $user->profile_picture_path = $path;
        }

        $user->save();


        $user->roles()->sync($request->input('roles'));

        return redirect()->route('admin.users.index')
            ->with('success', 'User updated successfully.');
    }

    public function destroy(User $user)
    {

        if ($user->id === Auth::id()) {
            return redirect()->route('admin.users.index')
                ->with('error', 'You cannot delete your own account.');
        }


        if ($user->profile_picture_path) {
            Storage::disk('public')->delete($user->profile_picture_path);
        }

        $user->delete();

        return redirect()->route('admin.users.index')
            ->with('success', 'User deleted successfully.');
    }

    public function bulkAction(Request $request)
    {
        $request->validate([
            'action' => ['required', 'in:activate,deactivate,delete'],
            'user_ids' => ['required', 'array'],
            'user_ids.*' => ['exists:users,id'],
        ]);

        $action = $request->input('action');
        $userIds = $request->input('user_ids');


        $userIds = array_diff($userIds, [Auth::id()]);

        if (empty($userIds)) {
            return redirect()->route('admin.users.index')
                ->with('error', 'Cannot perform actions on your own account.');
        }

        switch ($action) {
            case 'activate':
                User::whereIn('id', $userIds)->update(['is_active' => true]);
                $message = 'Users activated successfully.';
                break;

            case 'deactivate':
                User::whereIn('id', $userIds)->update(['is_active' => false]);
                $message = 'Users deactivated successfully.';
                break;

            case 'delete':

                $users = User::whereIn('id', $userIds)->get();

                foreach ($users as $user) {
                    if ($user->profile_picture_path) {
                        Storage::disk('public')->delete($user->profile_picture_path);
                    }
                }

                User::whereIn('id', $userIds)->delete();
                $message = 'Users deleted successfully.';
                break;

            default:
                $message = 'Invalid action.';
                break;
        }

        return redirect()->route('admin.users.index')
            ->with('success', $message);
    }

    /**
     * Allows an admin to login as another user (impersonation).
     *
     * @param User $user The user to impersonate
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function impersonate(User $user)
    {

        Session::put('admin_id', Auth::id());


        Auth::login($user);


        Session::put('impersonating', true);


        if ($user->hasRole('teacher')) {
            return redirect()->route('teacher.overview');
        } elseif ($user->hasRole('student')) {
            return redirect()->route('student.overview');
        } elseif ($user->hasRole('parent')) {
            return redirect()->route('parent.overview');
        } else {
            return redirect()->route('dashboard');
        }
    }
}
