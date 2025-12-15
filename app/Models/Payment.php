<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payment extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'payable_id',
        'payable_type',
        'amount',
        'currency',
        'status',
        'payment_gateway',
        'gateway_reference_id',
        'paid_at',
    ];

    protected $casts = [
        'paid_at' => 'datetime',
    ];
}
