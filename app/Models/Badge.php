<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class Badge extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'icon_path',
        'points',
        'criteria',
        'criteria_type',
        'criteria_value',
        'is_active',
    ];

    protected $casts = [
        'criteria' => 'array',
        'is_active' => 'boolean',
        'points' => 'integer',
    ];

    public function userBadges(): HasMany
    {
        return $this->hasMany(UserBadge::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_badges')
            ->withPivot('earned_at', 'award_reason')
            ->withTimestamps();
    }

    public function getIconUrlAttribute(): ?string
    {
        if (empty($this->icon_path)) {
            return null;
        }

        if (str_starts_with($this->icon_path, 'http')) {
            return $this->icon_path;
        }

        return asset('storage/' . $this->icon_path);
    }
}
