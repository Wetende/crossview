<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

final class Enrollment extends Model
{
    use HasFactory;
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'course_id',
        'enrolled_at',
        'completed_at',
        'progress',
        'access_type',
        'course_purchase_id',
        'order_id',
        'expiry_date',
        'status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'enrolled_at' => 'datetime',
        'completed_at' => 'datetime',
        'expiry_date' => 'datetime',
        'progress' => 'decimal:2',
    ];

    /**
     * Get the user (student) associated with the enrollment.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the course associated with the enrollment.
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the course purchase record if accessed via purchase.
     */
    public function coursePurchase(): BelongsTo
    {
        return $this->belongsTo(CoursePurchase::class, 'course_purchase_id');
    }

    /**
     * Get the order that created this enrollment.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    
    
    
    
}
