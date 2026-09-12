<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Hotel extends Model
{
    protected $fillable = [
        'name',
        'city',
        'address',
        'phone',
        'email',
        'category',
        'verified',
    ];

    protected $casts = [
        'verified' => 'boolean',
    ];
}
