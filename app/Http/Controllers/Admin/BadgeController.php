<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreBadgeRequest;
use App\Http\Requests\Admin\UpdateBadgeRequest;
use App\Models\Badge;
use App\Services\BadgeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\View\View;

final class BadgeController extends Controller
{
    public function __construct(
        private readonly BadgeService $badgeService
    ) {
    }

    public function index(): View
    {
        $badges = Badge::orderBy('name')->paginate(10);
        return view('admin.badges.index', compact('badges'));
    }

    public function create(): View
    {
        return view('admin.badges.create');
    }

    public function store(StoreBadgeRequest $request): RedirectResponse
    {
        $data = $request->validated();

        if ($request->hasFile('icon')) {
            $iconPath = $request->file('icon')->store('badges', 'public');
            $data['icon_path'] = $iconPath;
        }


        if (!isset($data['slug']) || empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        Badge::create($data);

        return redirect()->route('admin.badges.index')
            ->with('success', 'Badge created successfully.');
    }

    public function show(Badge $badge): View
    {
        return view('admin.badges.show', compact('badge'));
    }

    public function edit(Badge $badge): View
    {
        return view('admin.badges.edit', compact('badge'));
    }

    public function update(UpdateBadgeRequest $request, Badge $badge): RedirectResponse
    {
        $data = $request->validated();

        if ($request->hasFile('icon')) {

            if ($badge->icon_path && Storage::disk('public')->exists($badge->icon_path)) {
                Storage::disk('public')->delete($badge->icon_path);
            }

            $iconPath = $request->file('icon')->store('badges', 'public');
            $data['icon_path'] = $iconPath;
        }


        if (isset($data['name']) && $data['name'] !== $badge->name &&
            (!isset($data['slug']) || empty($data['slug']))) {
            $data['slug'] = Str::slug($data['name']);
        }

        $badge->update($data);

        return redirect()->route('admin.badges.index')
            ->with('success', 'Badge updated successfully.');
    }

    public function destroy(Badge $badge): RedirectResponse
    {

        $badgeInUse = $badge->userBadges()->exists();

        if ($badgeInUse) {
            return redirect()->route('admin.badges.index')
                ->with('error', 'Cannot delete badge because it has been awarded to users.');
        }


        if ($badge->icon_path && Storage::disk('public')->exists($badge->icon_path)) {
            Storage::disk('public')->delete($badge->icon_path);
        }

        $badge->delete();

        return redirect()->route('admin.badges.index')
            ->with('success', 'Badge deleted successfully.');
    }
}
